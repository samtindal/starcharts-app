import { separation, wrapDiff } from './angles.js';
import { longitudeAt, positionAt, MEAN_MOTION, type PointName } from './positions.js';
import { ASPECT_TYPES, aspectStrength, orbFor, type AspectType } from './aspects.js';

const DAY_MS = 86_400_000;

/**
 * Upcoming instants (UTC) when `a` and `b` reach the exact `type` angle,
 * scanning forward from `from`. Coarse 6 h scan + bisection refinement.
 *
 * We bracket zero-crossings of the SIGNED longitude difference against each
 * target offset, not of `separation() - angle`. `separation()` is folded into
 * [0, 180], so `sep - 0` never goes negative and `sep - 180` never goes
 * positive: conjunctions and oppositions register as a touch, not a crossing,
 * and a sign-change search silently finds nothing for exactly those two
 * (the most common) aspects. The signed difference crosses cleanly for all
 * five. An aspect of angle θ is exact when lon(a) − lon(b) ≡ +θ or −θ (mod
 * 360); for 0° and 180° those two targets coincide.
 */
export function nextExactAspectDates(
  a: PointName,
  type: AspectType,
  b: PointName,
  from: Date,
  spanDays = 730,
  maxHits = 4,
): Date[] {
  const angle = ASPECT_TYPES[type].angle;
  const targets = angle === 0 || angle === 180 ? [angle] : [angle, -angle];
  const stepMs = 6 * 3600 * 1000;
  const end = from.getTime() + spanDays * DAY_MS;
  const diff = (t: number) => longitudeAt(a, new Date(t)) - longitudeAt(b, new Date(t));

  const hits: number[] = [];
  for (const c of targets) {
    const f = (t: number) => wrapDiff(diff(t) - c);
    let prevT = from.getTime();
    let prevF = f(prevT);
    for (let t = prevT + stepMs; t <= end; t += stepMs) {
      const ft = f(t);
      // Sign change that isn't the ±180° seam of wrapDiff (|jump| < 180).
      if ((prevF < 0) !== (ft < 0) && Math.abs(ft - prevF) < 180) {
        let lo = prevT, hi = t;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          if ((f(lo) < 0) === (f(mid) < 0)) lo = mid; else hi = mid;
        }
        hits.push((lo + hi) / 2);
      }
      prevT = t; prevF = ft;
    }
  }

  // Merge the two target branches into one time-ordered list; drop near
  // duplicates (branches can converge near a station) and cap the count.
  hits.sort((x, y) => x - y);
  const out: Date[] = [];
  for (const t of hits) {
    if (out.length >= maxHits) break;
    if (out.length && Math.abs(t - out[out.length - 1].getTime()) < stepMs) continue;
    out.push(new Date(t));
  }
  return out;
}

/**
 * Most recent instant (UTC) before `before` when the pair was at the exact
 * `type` angle, or null when none falls inside the scan window. Reuses the
 * forward scanner over escalating back-spans so fast pairs (Moon aspects,
 * days apart) stay cheap and slow pairs still get a multi-year look-back.
 */
export function lastExactAspectDate(
  a: PointName,
  type: AspectType,
  b: PointName,
  before: Date,
  maxSpanDays = 1100,
): Date | null {
  for (const span of [60, 400, maxSpanDays]) {
    if (span > maxSpanDays) break;
    const start = new Date(before.getTime() - span * DAY_MS);
    const hits = nextExactAspectDates(a, type, b, start, span, 99)
      .filter((d) => d.getTime() < before.getTime());
    if (hits.length) return hits[hits.length - 1];
  }
  return null;
}

export interface StrengthSample {
  t: Date;
  /** aspectStrength in 'transit' mode; 0 whenever the pair is out of orb. */
  strength: number;
}
export interface StrengthTimeline {
  from: Date;
  to: Date;
  exact: Date;
  points: StrengthSample[];
}

/**
 * Aspect strength sampled across the transit window around one exact hit
 * (buildup to exactness, then fading out): the data behind the strength
 * graph on the aspect pages. The window is derived, not guessed: half-width
 * = orb / |relative speed at the exact instant| (degrees over degrees-per-day
 * = days), padded 40% so the curve visibly enters and leaves orb, clamped to
 * [0.5 day, 5 years] to survive retrograde stations where the relative speed
 * passes through zero. Pure and deterministic for a given (pair, exact).
 */
export function aspectStrengthTimeline(
  a: PointName,
  type: AspectType,
  b: PointName,
  exact: Date,
  samples = 121,
): StrengthTimeline {
  const angle = ASPECT_TYPES[type].angle;
  const maxOrb = orbFor(type, a, b);
  const rel = Math.abs(positionAt(a, exact).speed - positionAt(b, exact).speed);
  const halfDays = Math.min(Math.max((maxOrb / Math.max(rel, 1e-9)) * 1.4, 0.5), 1826);
  const from = new Date(exact.getTime() - halfDays * DAY_MS);
  const to = new Date(exact.getTime() + halfDays * DAY_MS);
  const points: StrengthSample[] = [];
  for (let i = 0; i < samples; i++) {
    const t = new Date(from.getTime() + ((to.getTime() - from.getTime()) * i) / (samples - 1));
    const pa = positionAt(a, t);
    const pb = positionAt(b, t);
    const sep = separation(pa.lon, pb.lon);
    const orb = Math.abs(sep - angle);
    if (orb > maxOrb) {
      points.push({ t, strength: 0 });
      continue;
    }
    // Applying test mirrors matchPair: does one hour of motion tighten the orb?
    const dt = 1 / 24;
    const sepNext = separation(pa.lon + pa.speed * dt, pb.lon + pb.speed * dt);
    const applying = Math.abs(sepNext - angle) < orb && pa.speed !== pb.speed;
    points.push({ t, strength: aspectStrength({ a, b, type, angle, orb, applying }, 'transit') });
  }
  return { from, to, exact, points };
}

/**
 * When a point occupies a given sign. Powers the "when this happens" spine of
 * the planet-in-sign pages: a real recurring calendar for fast bodies (Moon,
 * Sun, Mercury, Venus, Mars) and the current/next multi-year window for slow
 * ones. Scans forward from `from`, detecting sign-membership changes (which
 * handles retrograde re-entries naturally), and bisects each boundary crossing.
 *
 * `enter` is null when the point is already in the sign at `from` (it entered
 * before the window we scanned); `exit` is null when the point is still in the
 * sign at the end of the scan (a slow body mid-transit).
 */
export interface SignWindow {
  enter: Date | null;
  exit: Date | null;
}
export function signWindows(
  point: PointName,
  signIndex: number,
  from: Date,
  maxWindows = 3,
): { current: boolean; windows: SignWindow[] } {
  const inSign = (t: number) => Math.floor(longitudeAt(point, new Date(t)) / 30) % 12 === signIndex;
  // Step small enough to never skip a whole transit through the sign: a
  // fraction of the ~30deg/MEAN_MOTION days the point spends crossing a sign.
  const daysInSign = 30 / MEAN_MOTION[point];
  const stepMs = Math.max(0.25, Math.min(daysInSign / 8, 30)) * DAY_MS;
  const maxSteps = 6000;

  const bisectBoundary = (lo: number, hi: number): Date => {
    const loIn = inSign(lo);
    for (let i = 0; i < 44; i++) {
      const mid = (lo + hi) / 2;
      if (inSign(mid) === loIn) lo = mid; else hi = mid;
    }
    return new Date((lo + hi) / 2);
  };

  const current = inSign(from.getTime());
  const windows: SignWindow[] = [];
  let open: SignWindow | null = current ? { enter: null, exit: null } : null;
  let prevT = from.getTime();
  let prevIn = current;

  for (let i = 1; i <= maxSteps && windows.length < maxWindows; i++) {
    const t = from.getTime() + i * stepMs;
    const nowIn = inSign(t);
    if (nowIn !== prevIn) {
      const boundary = bisectBoundary(prevT, t);
      if (nowIn) {
        open = { enter: boundary, exit: null }; // entered the sign
      } else if (open) {
        open.exit = boundary;                    // left the sign
        windows.push(open);
        open = null;
      }
    }
    prevT = t; prevIn = nowIn;
  }
  if (open && windows.length < maxWindows) windows.push(open); // still inside at scan end
  return { current, windows };
}
