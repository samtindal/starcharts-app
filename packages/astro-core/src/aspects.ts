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

const isLuminary = (p: PointName) => p === 'Sun' || p === 'Moon';

/**
 * Extra orb granted when a luminary (Sun/Moon) is one of the pair. Tradition
 * gives the lights the widest orbs; everything else uses the base per-type orb.
 * One tunable table so every consumer (aspect detection AND the copy that
 * prints "within N deg") reads the same number, never a hardcoded literal.
 * (Owner-set defaults 2026-07-08; adjust here only.)
 */
const LUMINARY_BONUS: Record<AspectType, number> = {
  conjunction: 2,
  opposition: 2,
  trine: 1,
  square: 1,
  sextile: 0,
};

/**
 * The orb (max deviation from exact, in degrees) for `type` between `a` and `b`.
 * Base orb from the aspect type, widened when a luminary is involved. Nodes and
 * outer-only pairs get the base orb.
 */
export function orbFor(type: AspectType, a: PointName, b: PointName): number {
  const base = ASPECT_TYPES[type].orb;
  return isLuminary(a) || isLuminary(b) ? base + LUMINARY_BONUS[type] : base;
}

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
    const maxOrb = orbFor(type, pa.body, pb.body);
    if (orb <= maxOrb && (!best || orb < best.orb)) {
      const speedB = staticB ? 0 : pb.speed;
      const dt = 1 / 24; // one hour ahead
      const sepNext = separation(pa.lon + pa.speed * dt, pb.lon + speedB * dt);
      const applying = Math.abs(sepNext - def.angle) < orb && pa.speed - speedB !== 0;
      best = { a: pa.body, b: pb.body, type, angle: def.angle, orb, applying };
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 *  §9  ASPECT-IMPORTANCE SCORING
 * ------------------------------------------------------------------ *
 * One pure, deterministic strength score used to highlight the most important
 * aspects and to order every aspect list, in every mode (owner spec 2026-07-08).
 * No ML, no per-request cost.
 *
 * Shared base (all modes): orb tightness is the DOMINANT factor (it multiplies
 * everything and reads the same cutoff as detection via orbFor), times the
 * aspect type weight, times the luminary-weighted body weight.
 *
 * The `mode` selects the extra terms:
 *   transit           adds applying-vs-separating and duration/rarity
 *                     (the fleeting Moon down-weighted, rare slow-slow boosted).
 *   natal             a static snapshot: no time terms; a target-significance
 *                     term ranks contacts with the lights (Sun/Moon) highest.
 *   transit-to-natal  keeps the time terms AND weights by the natal point being
 *                     hit (b, per the crossAspects contract: a = transiting).
 *   synastry          static cross-chart: luminary contacts weigh most.
 *
 * Ascendant/angle contacts are not charted points in v1 (only the rising sign
 * is surfaced, not ASC-aspects), so the "target significance" term keys on the
 * two luminaries; extend here if angles become aspecting points later.
 * All weights live here, tunable in one place. */

export type StrengthMode = 'transit' | 'natal' | 'transit-to-natal' | 'synastry';

const TYPE_WEIGHT: Record<AspectType, number> = {
  conjunction: 1.0,
  opposition: 0.95,
  square: 0.85,
  trine: 0.85,
  sextile: 0.7,
};

/** Per-point weight: luminaries heaviest, then personal, social, outer, nodes. */
const POINT_WEIGHT: Record<PointName, number> = {
  Sun: 1.0, Moon: 1.0,
  Mercury: 0.8, Venus: 0.8, Mars: 0.8,
  Jupiter: 0.72, Saturn: 0.72,
  Uranus: 0.62, Neptune: 0.62, Pluto: 0.62,
  NorthNode: 0.5, SouthNode: 0.5,
};

const SLOW: ReadonlySet<PointName> = new Set<PointName>(['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']);

/**
 * Importance score for an aspect (higher = more significant), `mode`-aware.
 * Deterministic: identical (aspect, mode) always yields the identical number.
 * Default mode is 'transit' (the live clock, the most common caller).
 */
export function aspectStrength(asp: Aspect, mode: StrengthMode = 'transit'): number {
  const maxOrb = orbFor(asp.type, asp.a, asp.b);
  const tight = Math.max(0, 1 - asp.orb / maxOrb);          // 0..1
  // Damp the dominance of exactness (orb closeness) so that body importance,
  // aspect strength, and rarity can properly drive the ranking hierarchy.
  const tightW = 0.4 + 0.6 * tight;
  const bodyW = (POINT_WEIGHT[asp.a] + POINT_WEIGHT[asp.b]) / 2;
  let score = tightW * TYPE_WEIGHT[asp.type] * bodyW;       // shared base

  const touchesLuminary = isLuminary(asp.a) || isLuminary(asp.b);
  const applyW = asp.applying ? 1 : 0.9;                    // tightening reads stronger

  switch (mode) {
    case 'transit': {
      const moonW = asp.a === 'Moon' || asp.b === 'Moon' ? 0.75 : 1; // fleeting
      const rareW = SLOW.has(asp.a) && SLOW.has(asp.b) ? 1.15 : 1;   // rare, long
      score *= applyW * moonW * rareW;
      break;
    }
    case 'natal': {
      // Static birth snapshot: no time terms. Contacts with the lights matter most.
      score *= touchesLuminary ? 1.2 : 1;
      break;
    }
    case 'transit-to-natal': {
      // a = transiting body, b = natal point being hit. Keep the time terms and
      // weight by the significance of the natal point receiving the transit.
      const moonW = asp.a === 'Moon' ? 0.8 : 1;                 // transiting Moon = fleeting
      const rareW = SLOW.has(asp.a) ? 1.1 : 1;                  // slow transit = long, notable
      const natalW = 0.6 + 0.4 * POINT_WEIGHT[asp.b];           // target significance
      score *= applyW * moonW * rareW * natalW;
      break;
    }
    case 'synastry': {
      // Static cross-chart comparison: luminary contacts carry the most weight.
      score *= touchesLuminary ? 1.25 : 1;
      break;
    }
  }
  return score;
}

/** Aspects ordered by importance for `mode`, strongest first (stable, pure).
 * Does not mutate the input. Ties break by tighter orb then name so the order
 * is fully deterministic. */
export function rankAspects(aspects: Aspect[], mode: StrengthMode = 'transit'): Aspect[] {
  return [...aspects].sort((x, y) => {
    const d = aspectStrength(y, mode) - aspectStrength(x, mode);
    if (Math.abs(d) > 1e-12) return d;
    if (x.orb !== y.orb) return x.orb - y.orb;
    return `${x.a}${x.type}${x.b}`.localeCompare(`${y.a}${y.type}${y.b}`);
  });
}

/** Detect aspects between every pair within one chart. */
export function detectAspects(positions: BodyPosition[]): Aspect[] {
  const found: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      // The two nodes of one chart are opposite BY CONSTRUCTION,
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
 * `staticB: true`; for synastry both charts are birth charts, pass
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
