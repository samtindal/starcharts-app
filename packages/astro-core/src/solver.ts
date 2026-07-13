import { wrapDiff } from './angles.js';
import { longitudeAt, MEAN_MOTION, type PointName } from './positions.js';

const DAY_MS = 86_400_000;

/**
 * Newton iteration with numerically estimated rate and clamped steps.
 * Returns epoch ms on convergence, null when the retrograde geometry
 * defeats it (target beyond the local loop, oscillating brackets, …).
 */
function newtonSolve(planet: PointName, targetLon: number, t0: number): number | null {
  let t = t0;
  const meanRate = MEAN_MOTION[planet] / DAY_MS; // deg/ms
  for (let i = 0; i < 25; i++) {
    const lon = longitudeAt(planet, new Date(t));
    const err = wrapDiff(targetLon - lon);
    if (Math.abs(err) < 1e-4) return t;
    const probeMs = Math.min(DAY_MS / 4, Math.abs(err) / meanRate / 8 + 60_000);
    const lonAhead = longitudeAt(planet, new Date(t + probeMs));
    let rate = wrapDiff(lonAhead - lon) / probeMs;
    if (Math.abs(rate) < meanRate / 50) rate = meanRate * Math.sign(rate || 1); // station floor
    let step = err / rate;
    const maxStep = Math.abs(err) / (meanRate / 2) + DAY_MS;
    if (Math.abs(step) > maxStep) step = Math.sign(step) * maxStep;
    t += step;
  }
  const finalErr = wrapDiff(targetLon - longitudeAt(planet, new Date(t)));
  return Math.abs(finalErr) < 1e-3 ? t : null;
}

/** Bisection on f(t) = wrapDiff(lon(t) − target) inside a sign-change bracket. */
function bisect(planet: PointName, targetLon: number, lo: number, hi: number): number {
  let flo = wrapDiff(longitudeAt(planet, new Date(lo)) - targetLon);
  for (let i = 0; i < 60 && hi - lo > 500; i++) {
    const mid = (lo + hi) / 2;
    const fmid = wrapDiff(longitudeAt(planet, new Date(mid)) - targetLon);
    if (Math.abs(fmid) < 1e-5) return mid;
    if ((flo < 0) === (fmid < 0)) { lo = mid; flo = fmid; } else { hi = mid; }
  }
  return (lo + hi) / 2;
}

/**
 * Robust fallback: sample a window around t0, collect every sign-change
 * bracket of f(t), pick the one nearest in time, weighted so brackets in
 * `preferDirection` win over slightly-nearer ones behind us (hysteresis
 * keeps a drag from flickering between past and future branches).
 */
function bracketedSolve(
  planet: PointName, targetLon: number, t0: number, preferDirection: number,
): number | null {
  const synodicMs = (360 / MEAN_MOTION[planet]) * DAY_MS;
  const span = Math.min(synodicMs, 500 * DAY_MS);
  const N = 256;
  const step = (2 * span) / N;
  let prevT = t0 - span;
  let prevF = wrapDiff(longitudeAt(planet, new Date(prevT)) - targetLon);
  const brackets: Array<{ lo: number; hi: number; mid: number }> = [];
  for (let i = 1; i <= N; i++) {
    const t = t0 - span + i * step;
    const f = wrapDiff(longitudeAt(planet, new Date(t)) - targetLon);
    // A sign change is a root only if it isn't the ±180° seam of wrapDiff.
    if ((prevF < 0) !== (f < 0) && Math.abs(f - prevF) < 180) {
      brackets.push({ lo: prevT, hi: t, mid: (prevT + t) / 2 });
    }
    prevT = t; prevF = f;
  }
  if (brackets.length === 0) return null;
  brackets.sort((a, b) => {
    const wa = Math.abs(a.mid - t0) * (preferDirection && Math.sign(a.mid - t0) !== preferDirection ? 4 : 1);
    const wb = Math.abs(b.mid - t0) * (preferDirection && Math.sign(b.mid - t0) !== preferDirection ? 4 : 1);
    return wa - wb;
  });
  const best = brackets[0];
  return bisect(planet, targetLon, best.lo, best.hi);
}

/**
 * Inverse ephemeris: the Date nearest `near` at which `planet` sits at
 * `targetLon` (PLAN.md §4, the drag→time solver).
 *
 * `preferDirection` (+1 future / −1 past / 0 none) biases branch choice when
 * several crossings exist (retrograde loops). Drag callers should pass the
 * time-direction of the previous frame for continuity.
 */
export function dateForLongitude(
  planet: PointName,
  targetLon: number,
  near: Date,
  preferDirection: -1 | 0 | 1 = 0,
): Date {
  const t0 = near.getTime();
  let t = newtonSolve(planet, targetLon, t0);

  // Hysteresis: if Newton landed against the preferred direction, see if a
  // solution exists the preferred way; keep Newton's answer otherwise.
  if (t !== null && preferDirection !== 0 && Math.sign(t - t0) === -preferDirection) {
    const alt = bracketedSolve(planet, targetLon, t0, preferDirection);
    if (alt !== null && Math.sign(alt - t0) === preferDirection) t = alt;
  }

  if (t === null) t = bracketedSolve(planet, targetLon, t0, preferDirection);
  if (t === null) t = t0; // give up gracefully: don't move time
  return new Date(t);
}
