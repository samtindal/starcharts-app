import { separation } from './angles.js';
import type { BodyPosition, PointName } from './positions.js';

const isNodeName = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';

export const ASPECT_TYPES = {
  conjunction: { angle: 0, orb: 8, harmony: 'neutral' },
  sextile: { angle: 60, orb: 5, harmony: 'soft' },
  square: { angle: 90, orb: 7, harmony: 'hard' },
  trine: { angle: 120, orb: 7, harmony: 'soft' },
  opposition: { angle: 180, orb: 8, harmony: 'hard' },
} as const;
export type AspectType = keyof typeof ASPECT_TYPES;

export interface Aspect {
  a: PointName;
  b: PointName;
  type: AspectType;
  /** Exact angle of the aspect type (0, 60, 90, 120, 180) */
  angle: number;
  /** How far from exact, degrees ≥ 0 */
  orb: number;
  /** True if the aspect is tightening (bodies moving toward exact) */
  applying: boolean;
}

/**
 * Match one pair of positions to at most one aspect type (nearest by orb).
 * `staticB` treats b as fixed (natal points don't move under transits).
 */
function matchPair(pa: BodyPosition, pb: BodyPosition, staticB: boolean): Aspect | null {
  const sep = separation(pa.lon, pb.lon);
  let best: Aspect | null = null;
  for (const [type, def] of Object.entries(ASPECT_TYPES) as [AspectType, (typeof ASPECT_TYPES)[AspectType]][]) {
    const orb = Math.abs(sep - def.angle);
    if (orb <= def.orb && (!best || orb < best.orb)) {
      const speedB = staticB ? 0 : pb.speed;
      const dt = 1 / 24; // one hour ahead
      const sepNext = separation(pa.lon + pa.speed * dt, pb.lon + speedB * dt);
      const applying = Math.abs(sepNext - def.angle) < orb && pa.speed - speedB !== 0;
      best = { a: pa.body, b: pb.body, type, angle: def.angle, orb, applying };
    }
  }
  return best;
}

/** Detect aspects between every pair within one chart. */
export function detectAspects(positions: BodyPosition[]): Aspect[] {
  const found: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      // The two nodes of one chart are opposite BY CONSTRUCTION —
      // reporting that permanent opposition would be noise.
      if (isNodeName(positions[i].body) && isNodeName(positions[j].body)) continue;
      const hit = matchPair(positions[i], positions[j], false);
      if (hit) found.push(hit);
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}

/**
 * Detect aspects between two charts (every A-body × every B-body).
 * For transits pass the moving chart as A, the natal chart as B with
 * `staticB: true`; for synastry both charts are birth charts — pass
 * `staticB: true` there too (neither moves in the comparison frame,
 * so `applying` is not meaningful and comes back false).
 */
export function crossAspects(
  a: BodyPosition[],
  b: BodyPosition[],
  opts: { staticB?: boolean } = {},
): Aspect[] {
  const staticB = opts.staticB ?? true;
  const found: Aspect[] = [];
  for (const pa of a) {
    for (const pb of b) {
      const hit = matchPair(pa, pb, staticB);
      if (hit) found.push(hit);
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}
