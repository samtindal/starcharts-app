import { POINTS, SIGNS, ASPECT_TYPES, SIGN_TRADITION } from '@starcharts/astro-core';
import type { PointName, SignName, AspectType, Aspect } from '@starcharts/astro-core';

/**
 * Next dates when a pair reaches an exact aspect angle. The calculation lives
 * in astro-core (single source of truth); re-exported here under the name the
 * pages already import.
 */
export { nextExactAspectDates as nextExactDates } from '@starcharts/astro-core';

/** U+FE0E forces monochrome text glyphs (Apple otherwise renders emoji). */
export const T = (s: string) => s + '︎';

export const PLANET_GLYPH: Record<PointName, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃',
  Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', NorthNode: '☊', SouthNode: '☋',
};
export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
/** Base planet glyph size is 24 (set in Wheel); these get optical corrections. */
export const GLYPH_SIZE: Partial<Record<PointName, number>> = { Sun: 30, Moon: 28, NorthNode: 26, SouthNode: 26 };

export const ASPECT_SYMBOL: Record<AspectType, string> = {
  conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍',
};

export const displayName = (b: string) => b.replace(/([a-z])([A-Z])/g, '$1 $2');
export const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const unkebabMap = new Map(POINTS.map((p) => [kebab(p), p]));
export const pointFromSlug = (s: string): PointName | undefined => unkebabMap.get(s);
export const signFromSlug = (s: string): SignName | undefined =>
  (SIGNS as readonly string[]).includes(s[0]?.toUpperCase() + s.slice(1)) ? ((s[0].toUpperCase() + s.slice(1)) as SignName) : undefined;

export const aspectSlug = (a: PointName, type: AspectType, b: PointName) =>
  `${kebab(a)}-${type}-${kebab(b)}`;
export const aspectPath = (asp: Aspect) => `/aspects/${aspectSlug(asp.a, asp.type, asp.b)}`;
export const planetPath = (p: PointName) => `/planets/${kebab(p)}`;
export const signPath = (s: SignName | number) =>
  `/signs/${(typeof s === 'number' ? SIGNS[s] : s).toLowerCase()}`;
/** Planet-in-sign page, e.g. /planets/venus/leo (D3). */
export const planetInSignPath = (p: PointName, s: SignName | number) =>
  `${planetPath(p)}/${(typeof s === 'number' ? SIGNS[s] : s).toLowerCase()}`;

/** element / modality / approx Sun-transit dates / keywords.
 * (Ruler now derives from astro-core's SIGN_TRADITION via TRADITIONAL_RULER
 * below, single source with the composed sign copy.) */
export const SIGN_INFO: Record<SignName, { element: string; modality: string; dates: string; keywords: string }> = {
  Aries: { element: 'Fire', modality: 'Cardinal', dates: 'March 21 – April 19', keywords: 'initiative, courage, the spark that starts things' },
  Taurus: { element: 'Earth', modality: 'Fixed', dates: 'April 20 – May 20', keywords: 'steadiness, pleasure, what endures' },
  Gemini: { element: 'Air', modality: 'Mutable', dates: 'May 21 – June 20', keywords: 'curiosity, exchange, the two-sided mind' },
  Cancer: { element: 'Water', modality: 'Cardinal', dates: 'June 21 – July 22', keywords: 'protection, memory, the tides of feeling' },
  Leo: { element: 'Fire', modality: 'Fixed', dates: 'July 23 – August 22', keywords: 'radiance, performance, the generous heart' },
  Virgo: { element: 'Earth', modality: 'Mutable', dates: 'August 23 – September 22', keywords: 'craft, discernment, useful service' },
  Libra: { element: 'Air', modality: 'Cardinal', dates: 'September 23 – October 22', keywords: 'balance, partnership, the art of the fair' },
  Scorpio: { element: 'Water', modality: 'Fixed', dates: 'October 23 – November 21', keywords: 'intensity, depth, what lies beneath' },
  Sagittarius: { element: 'Fire', modality: 'Mutable', dates: 'November 22 – December 21', keywords: 'horizon-seeking, faith, the long arrow' },
  Capricorn: { element: 'Earth', modality: 'Cardinal', dates: 'December 22 – January 19', keywords: 'ambition, mastery, the mountain path' },
  Aquarius: { element: 'Air', modality: 'Fixed', dates: 'January 20 – February 18', keywords: 'invention, the collective, the view from outside' },
  Pisces: { element: 'Water', modality: 'Mutable', dates: 'February 19 – March 20', keywords: 'dissolution, compassion, the boundless sea' },
};

/** Traditional ruler as a linkable point (from astro-core, single source). */
export const TRADITIONAL_RULER = (s: SignName): PointName => SIGN_TRADITION[s].ruler;
/** Display form: luminaries take the article ("the Moon"), planets don't. */
export const rulerDisplay = (s: SignName): string => {
  const p = TRADITIONAL_RULER(s);
  return p === 'Sun' || p === 'Moon' ? `the ${p}` : p;
};

/** Traditional dignities: rulership(s) and exaltation, linked on planet pages.
 * Outer planets carry MODERN sign associations (flagged), and the nodes none:
 * the tradition does not assign dignities to points (D5 honesty rule). */
export const DIGNITIES: Record<PointName, { rules: SignName[]; exaltation: SignName | null; modern?: boolean }> = {
  Sun: { rules: ['Leo'], exaltation: 'Aries' },
  Moon: { rules: ['Cancer'], exaltation: 'Taurus' },
  Mercury: { rules: ['Gemini', 'Virgo'], exaltation: 'Virgo' },
  Venus: { rules: ['Taurus', 'Libra'], exaltation: 'Pisces' },
  Mars: { rules: ['Aries', 'Scorpio'], exaltation: 'Capricorn' },
  Jupiter: { rules: ['Sagittarius', 'Pisces'], exaltation: 'Cancer' },
  Saturn: { rules: ['Capricorn', 'Aquarius'], exaltation: 'Libra' },
  Uranus: { rules: ['Aquarius'], exaltation: null, modern: true },
  Neptune: { rules: ['Pisces'], exaltation: null, modern: true },
  Pluto: { rules: ['Scorpio'], exaltation: null, modern: true },
  NorthNode: { rules: [], exaltation: null },
  SouthNode: { rules: [], exaltation: null },
};

export const ARCHETYPE: Record<PointName, string> = {
  Sun: 'identity and vitality', Moon: 'instinct and feeling', Mercury: 'mind and message',
  Venus: 'attraction and values', Mars: 'drive and desire', Jupiter: 'expansion and faith',
  Saturn: 'structure and limits', Uranus: 'disruption and awakening', Neptune: 'dreams and dissolution',
  Pluto: 'power and transformation', NorthNode: 'the path being learned', SouthNode: 'the familiar past',
};

export const PLANET_BLURB: Record<PointName, string> = {
  Sun: 'The center of the chart as of the sky: the Sun marks identity, vitality, and the sign most people mean when they name "their" sign.',
  Moon: 'The fastest mover, circling the zodiac in under a month. The Moon governs instinct, mood, and the private inner weather.',
  Mercury: 'Messenger and trickster: thought, speech, trade, and travel. Famous for its retrogrades, three or so each year.',
  Venus: 'What we find beautiful and what we value, attraction, art, and the terms on which we connect.',
  Mars: 'The engine: desire, courage, conflict, and the will to act.',
  Jupiter: 'The greater benefic: growth, luck, meaning, and the appetite for more. About a year per sign.',
  Saturn: 'The taskmaster: limits, time, discipline, and what must be earned. About two and a half years per sign.',
  Uranus: 'The awakener: sudden reversals, invention, liberation. Roughly seven years per sign, a generational marker.',
  Neptune: 'The dissolver: dreams, glamour, compassion, confusion. Fourteen years per sign.',
  Pluto: 'The transformer: power, death-and-rebirth, what is buried and what erupts. A generation per sign.',
  NorthNode: 'Not a body but a point: where the Moon’s path crosses the ecliptic heading north. Read as the direction of growth.',
  SouthNode: 'The North Node’s opposite: the familiar past, talents already banked, the comfortable rut.',
};

export const MEANING: Record<AspectType, string> = {
  conjunction: 'fused energies, acting as one',
  sextile: 'easy opportunity, offered not forced',
  square: 'friction and tension that demand action',
  trine: 'harmonious flow, talents reinforcing each other',
  opposition: 'polarity, a balance to be struck across a divide',
};

export const MEANING_LONG: Record<AspectType, string> = {
  conjunction: 'The two points occupy the same degree of the zodiac, blending their natures into a single force. Traditional astrology reads this as intensity: neither planet can act without the other.',
  sextile: 'Sixty degrees apart, in compatible elements. An opening that rewards initiative; traditionally the aspect of opportunity offered but not imposed.',
  square: 'Ninety degrees of friction between incompatible modes. The classical aspect of crisis and growth: energy that demands resolution through action.',
  trine: 'One hundred twenty degrees, same element. Effortless mutual support: talent so natural it can be squandered. The great harmonizing aspect.',
  opposition: 'Face to face across the wheel. Projection, partnership, and the search for balance between two poles that each hold half the truth.',
};

/** POINTS-ordered (canonical) slug for a pair regardless of argument order. */
export function canonicalAspectSlug(a: PointName, type: AspectType, b: PointName): string {
  const [x, y] = POINTS.indexOf(a) <= POINTS.indexOf(b) ? [a, b] : [b, a];
  return aspectSlug(x, type, y);
}

/**
 * Related same-type pairs sharing one endpoint with (a, b): the outbound half
 * of the aspect pages' internal-link rail. Deterministic per page (a rotation
 * seeded by the pair's POINTS indices), canonical order, node-node excluded.
 */
export function relatedAspects(a: PointName, type: AspectType, b: PointName, count = 3): ParsedAspectSlug[] {
  const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';
  const seen = new Set<string>([canonicalAspectSlug(a, type, b)]);
  const out: ParsedAspectSlug[] = [];
  for (const [keep, swap] of [[a, b], [b, a]] as [PointName, PointName][]) {
    for (const x of POINTS) {
      if (x === keep || x === swap) continue;
      if (isNode(keep) && isNode(x)) continue;
      const slug = canonicalAspectSlug(keep, type, x);
      if (seen.has(slug)) continue;
      seen.add(slug);
      const [p, q] = POINTS.indexOf(keep) <= POINTS.indexOf(x) ? [keep, x] : [x, keep];
      out.push({ a: p, type, b: q });
    }
  }
  const rot = (POINTS.indexOf(a) + POINTS.indexOf(b)) % out.length;
  return [...out.slice(rot), ...out.slice(0, rot)].slice(0, count);
}

/** All canonical aspect-page params: POINTS-ordered pairs × 5 types, minus NN–SN. */
export function allAspectSlugs(): string[] {
  const slugs: string[] = [];
  const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';
  for (let i = 0; i < POINTS.length; i++) {
    for (let j = i + 1; j < POINTS.length; j++) {
      if (isNode(POINTS[i]) && isNode(POINTS[j])) continue;
      for (const type of Object.keys(ASPECT_TYPES) as AspectType[]) {
        slugs.push(aspectSlug(POINTS[i], type, POINTS[j]));
      }
    }
  }
  return slugs;
}

export interface ParsedAspectSlug { a: PointName; type: AspectType; b: PointName }
export function parseAspectSlug(slug: string): ParsedAspectSlug | null {
  for (const type of Object.keys(ASPECT_TYPES) as AspectType[]) {
    const idx = slug.indexOf(`-${type}-`);
    if (idx > 0) {
      const a = pointFromSlug(slug.slice(0, idx));
      const b = pointFromSlug(slug.slice(idx + type.length + 2));
      if (a && b) return { a, type, b };
    }
  }
  return null;
}

export const fmtUTC = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(d) + ' UTC';

export const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
