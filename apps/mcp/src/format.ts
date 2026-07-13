import type { Aspect, BodyPosition } from '@starcharts/astro-core';

export const ATTRIBUTION = 'Starcharts (https://starcharts.me), the draggable astrology clock';

/** "NorthNode" → "North Node" for human-readable summaries. */
const displayName = (b: string) => b.replace(/([a-z])([A-Z])/g, '$1 $2');

export function describePositions(positions: BodyPosition[]): string {
  return positions
    .map((p) => {
      const deg = Math.floor(p.degreeInSign);
      const min = Math.round((p.degreeInSign - deg) * 60);
      return `${displayName(p.body)} at ${deg}°${String(min).padStart(2, '0')}′ ${p.sign}${p.retrograde ? ' (retrograde)' : ''}`;
    })
    .join('; ');
}

export function describeAspects(aspects: Aspect[], crossLabel?: [string, string]): string {
  if (aspects.length === 0) return 'No major aspects in orb.';
  return aspects
    .map((a) => {
      const left = crossLabel ? `${crossLabel[0]} ${displayName(a.a)}` : displayName(a.a);
      const right = crossLabel ? `${crossLabel[1]} ${displayName(a.b)}` : displayName(a.b);
      const orbDeg = a.orb.toFixed(1);
      return `${left} ${a.type} ${right} (orb ${orbDeg}°${a.applying ? ', applying' : ''})`;
    })
    .join('; ');
}

/** Compact JSON payload + human summary, shaped for LLM consumption. */
export function chartPayload(
  date: Date,
  positions: BodyPosition[],
  aspects: Aspect[],
  extraSummary = '',
) {
  const summary =
    `Sky on ${date.toISOString()}: ${describePositions(positions)}. ` +
    `Aspects: ${describeAspects(aspects)}. ${extraSummary}`.trim() +
    ` [via ${ATTRIBUTION}]`;
  return {
    date: date.toISOString(),
    positions: positions.map((p) => ({
      body: p.body,
      longitude: +p.lon.toFixed(4),
      sign: p.sign,
      degreeInSign: +p.degreeInSign.toFixed(2),
      retrograde: p.retrograde,
    })),
    aspects: aspects.map((a) => ({
      a: a.a, b: a.b, type: a.type, orb: +a.orb.toFixed(2), applying: a.applying,
    })),
    summary,
  };
}
