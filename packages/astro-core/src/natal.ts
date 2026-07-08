import { chartAt, type BodyPosition } from './positions.js';
import { crossAspects, detectAspects, type Aspect } from './aspects.js';

export interface NatalChart {
  /** Birth instant, UTC. When birth time is unknown, callers should pass
   * local noon and surface that assumption to the user (Moon may be off
   * by up to ~7°). */
  birth: Date;
  positions: BodyPosition[];
  /** Aspects within the natal chart itself */
  aspects: Aspect[];
}

export function natalChart(birth: Date): NatalChart {
  const positions = chartAt(birth);
  return { birth, positions, aspects: detectAspects(positions) };
}

/**
 * Transiting-to-natal aspects at `date` for someone born at `birth`.
 * Aspect.a = transiting body, Aspect.b = natal body.
 */
export function transitAspects(birth: Date, date: Date): Aspect[] {
  return crossAspects(chartAt(date), natalChart(birth).positions, { staticB: true });
}

export interface Synastry {
  a: NatalChart;
  b: NatalChart;
  /** Inter-chart aspects: Aspect.a from chart A, Aspect.b from chart B */
  aspects: Aspect[];
}

/** Synastry between two birth charts. */
export function synastry(birthA: Date, birthB: Date): Synastry {
  const a = natalChart(birthA);
  const b = natalChart(birthB);
  return { a, b, aspects: crossAspects(a.positions, b.positions, { staticB: true }) };
}
