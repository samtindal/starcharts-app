/**
 * Lunar surfaces for the "sky today" pages: moon phase (B3 §5) and the
 * void-of-course Moon (B3 §6). Pure calc, single source of truth, so the web
 * page, the MCP server, and any OG caption print the same values.
 */
import { wrapDiff, norm360 } from './angles.js';
import { longitudeAt, PLANETS, type PointName } from './positions.js';
import { Illumination, Body, SearchMoonPhase } from './ephemeris.js';

const DAY_MS = 86_400_000;

export type PhaseName =
  | 'new' | 'waxing crescent' | 'first quarter' | 'waxing gibbous'
  | 'full' | 'waning gibbous' | 'last quarter' | 'waning crescent';

/** 8 phase buckets as 45deg octants CENTERED on the exact points (new=0,
 * first quarter=90, full=180, last quarter=270), so "new"/"full" straddle
 * their exact instant symmetrically rather than starting at it. */
const PHASE_NAMES: PhaseName[] = [
  'new', 'waxing crescent', 'first quarter', 'waxing gibbous',
  'full', 'waning gibbous', 'last quarter', 'waning crescent',
];
function phaseName(angle: number): PhaseName {
  return PHASE_NAMES[Math.floor((norm360(angle + 22.5)) / 45) % 8];
}

export interface MoonPhase {
  /** Moon minus Sun ecliptic longitude, [0,360). 0 new, 90 first quarter, 180 full. */
  angle: number;
  name: PhaseName;
  /** Illuminated fraction 0..1 (physically exact, from astronomy-engine). */
  illumination: number;
  nextNew: Date;
  nextFull: Date;
}

export function moonPhase(date: Date): MoonPhase {
  const angle = norm360(longitudeAt('Moon', date) - longitudeAt('Sun', date));
  const illumination = Illumination(Body.Moon, date).phase_fraction;
  // SearchMoonPhase looks forward for the next time the phase angle equals the
  // target (0 = new, 180 = full); a generous window covers a full synodic month.
  const nextNew = SearchMoonPhase(0, date, 40)!.date;
  const nextFull = SearchMoonPhase(180, date, 40)!.date;
  return { angle, name: phaseName(angle), illumination, nextNew, nextFull };
}

/* ------------------------------------------------------------------ *
 *  VOID-OF-COURSE MOON (B3 §6)
 * ------------------------------------------------------------------ */

/**
 * The aspect set for void-of-course: the Moon's Ptolemaic aspects to the other
 * nine bodies of the modern ten (Sun through Pluto). Owner decision 2026-07-08:
 * the 10-body modern set, not the 7-body traditional one. Nodes are points, not
 * bodies the Moon "aspects" for VoC, and are excluded. Copy that reports VoC
 * must state this convention.
 */
export const VOC_BODIES: PointName[] = PLANETS.filter((p) => p !== 'Moon');
const PTOLEMAIC = [0, 60, 90, 120, 180];

/** Next (dir +1) or previous (dir -1) Moon sign ingress from `date`. */
function moonIngress(date: Date, dir: 1 | -1): Date {
  const stepMs = 30 * 60 * 1000; // 30 min; Moon moves ~0.27deg
  let prevT = date.getTime();
  let prevSign = Math.floor(longitudeAt('Moon', date) / 30);
  for (let i = 1; i <= 5 * 48; i++) {
    const t = date.getTime() + dir * i * stepMs;
    const sign = Math.floor(longitudeAt('Moon', new Date(t)) / 30);
    if (sign !== prevSign) {
      // Bisect the crossing between prevT and t.
      let lo = Math.min(prevT, t), hi = Math.max(prevT, t);
      const boundary = (s: number) => Math.floor(longitudeAt('Moon', new Date(s)) / 30);
      const loSign = boundary(lo);
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (boundary(mid) === loSign) lo = mid; else hi = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prevT = t; prevSign = sign;
  }
  // Fallback (should not happen: a sign transit is < 2.6 days): +/- 2.6 days.
  return new Date(date.getTime() + dir * 2.6 * DAY_MS);
}

/** Exact-aspect times of the Moon to `body` within [t0, t1] (ms), any Ptolemaic angle. */
function moonAspectTimes(body: PointName, t0: number, t1: number): number[] {
  const stepMs = 30 * 60 * 1000;
  const diff = (t: number) => longitudeAt('Moon', new Date(t)) - longitudeAt(body, new Date(t));
  const hits: number[] = [];
  for (const angle of PTOLEMAIC) {
    const targets = angle === 0 || angle === 180 ? [angle] : [angle, -angle];
    for (const c of targets) {
      const f = (t: number) => wrapDiff(diff(t) - c);
      let prevT = t0, prevF = f(t0);
      for (let t = t0 + stepMs; t <= t1; t += stepMs) {
        const ft = f(t);
        if ((prevF < 0) !== (ft < 0) && Math.abs(ft - prevF) < 180) {
          let lo = prevT, hi = t;
          for (let k = 0; k < 40; k++) {
            const mid = (lo + hi) / 2;
            if ((f(lo) < 0) === (f(mid) < 0)) lo = mid; else hi = mid;
          }
          hits.push((lo + hi) / 2);
        }
        prevT = t; prevF = ft;
      }
    }
  }
  return hits;
}

export interface VoidOfCourse {
  isVoid: boolean;
  /** Instant of the Moon's last exact aspect before the coming ingress. Null
   * only if it made no aspect at all in the current sign (then void since it
   * entered the sign, see `enteredSign`). */
  since: Date | null;
  /** Next Moon sign ingress (void ends here). */
  until: Date;
  /** When the Moon entered the sign it is currently transiting. */
  enteredSign: Date;
}

/**
 * Void-of-course status at `date`. The Moon is void from its last exact
 * Ptolemaic aspect to one of the VOC_BODIES until it ingresses the next sign.
 */
export function voidOfCourse(date: Date): VoidOfCourse {
  const until = moonIngress(date, 1);
  const enteredSign = moonIngress(date, -1);
  const all: number[] = [];
  for (const body of VOC_BODIES) {
    all.push(...moonAspectTimes(body, enteredSign.getTime(), until.getTime()));
  }
  all.sort((a, b) => a - b);
  const last = all.length ? all[all.length - 1] : null;
  const since = last !== null ? new Date(last) : null;
  const isVoid = since !== null ? date.getTime() >= since.getTime() : true;
  return { isVoid, since, until, enteredSign };
}
