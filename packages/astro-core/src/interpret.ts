/**
 * Interpretation text generator: fully generated, deep, non-repetitive prose
 * for aspect pages (325) and planet-in-sign pages (144). No hand-written
 * per-page copy anywhere; depth comes from composing many independent
 * dimensions, not from authoring essays.
 *
 * Why this lives in astro-core (not apps/web): the same rule as positions and
 * aspects. Web pages, the MCP server's plain-language summaries, and OG-image
 * captions must never disagree, so the single source of the words belongs
 * beside the single source of the numbers. This module is pure (strings only,
 * no DOM, no framework); apps/web re-exports it from `lib/compose.ts`.
 *
 * Depth model, per aspect page (all generated):
 *   1. opener        what this aspect is, for this pair
 *   2. energies      what each of the two points governs
 *   3. combination   how this aspect quality makes the pair interact
 *   4. balance       at its best / under strain, per pair
 *   5. transit/natal how it reads as a passing transit vs a birth-chart trait
 * Each paragraph is chosen from several phrasings by `pick()`, seeded on the
 * page slug plus the section name, so sections vary independently, neighbouring
 * pages differ, and any page is byte-stable between renders.
 *
 * Owner rules: no em dashes (commas/colons/semicolons/periods only);
 * tradition-framed; no fate-for-payment claims; no colours/orb numbers here.
 *
 * Interpretation grounded in standard significations (Cafe Astrology, TimePassages,
 * Labyrinthos, Wikipedia "Astrological aspect" / "Planets in astrology"); see
 * docs/content-quality-bar.md for sources.
 */

import { SIGNS } from './positions.js';
import type { PointName, SignName } from './positions.js';
import type { AspectType } from './aspects.js';

export interface Voice {
  name: string;    // display name, e.g. "Mars"
  noun: string;    // subject noun phrase: "the will to act"
  domain: string;  // territory: "desire, courage, and conflict"
  gives: string;   // contribution: "heat and nerve"
  needs: string;   // what it wants: "a target"
  shadow: string;  // failure mode: "aggression"
  verb: string;    // how it acts: "pushes forward"
  sphere: string;  // life area: "drive, courage, and appetite"
  atBest: string;  // "courage that is well aimed"
  atWorst: string; // "force for its own sake"
}

export const VOICES: Record<PointName, Voice> = {
  Sun: { name: 'the Sun', noun: 'the core self', domain: 'identity, vitality, and the will to shine', gives: 'warmth and purpose', needs: 'something to illuminate', shadow: 'pride', verb: 'shines', sphere: 'selfhood, confidence, and creative vitality', atBest: 'a steady, generous sense of who you are', atWorst: 'pride that has to be the center' },
  Moon: { name: 'the Moon', noun: 'the feeling body', domain: 'instinct, mood, and the need for safety', gives: 'tenderness and memory', needs: 'shelter', shadow: 'moodiness', verb: 'feels its way', sphere: 'emotion, habit, and the need to belong', atBest: 'a nourishing, honest emotional instinct', atWorst: 'moods that rule the day' },
  Mercury: { name: 'Mercury', noun: 'the thinking mind', domain: 'thought, speech, and exchange', gives: 'quickness and wit', needs: 'something to work out', shadow: 'restlessness', verb: 'connects', sphere: 'thinking, talking, and trading', atBest: 'a clear, agile, curious mind', atWorst: 'nervous talk that never lands' },
  Venus: { name: 'Venus', noun: 'the power of attraction', domain: 'love, beauty, and what we value', gives: 'charm and ease', needs: 'someone to draw close', shadow: 'indulgence', verb: 'draws close', sphere: 'love, pleasure, and taste', atBest: 'warmth that puts others at ease', atWorst: 'a taste for comfort that avoids the hard thing' },
  Mars: { name: 'Mars', noun: 'the will to act', domain: 'desire, courage, and conflict', gives: 'heat and nerve', needs: 'a target', shadow: 'aggression', verb: 'pushes forward', sphere: 'drive, courage, and appetite', atBest: 'courage that is well aimed', atWorst: 'force for its own sake' },
  Jupiter: { name: 'Jupiter', noun: 'the appetite for more', domain: 'growth, luck, and meaning', gives: 'faith and generosity', needs: 'room to expand', shadow: 'excess', verb: 'expands', sphere: 'growth, belief, and good fortune', atBest: 'generous faith that opens doors', atWorst: 'more for the sake of more' },
  Saturn: { name: 'Saturn', noun: 'the principle of limit', domain: 'structure, time, and discipline', gives: 'patience and backbone', needs: 'a rule to keep', shadow: 'coldness', verb: 'builds and restrains', sphere: 'work, time, and responsibility', atBest: 'patience that builds something lasting', atWorst: 'fear that hardens into a wall' },
  Uranus: { name: 'Uranus', noun: 'the urge to break free', domain: 'disruption, invention, and awakening', gives: 'originality and surprise', needs: 'something to overturn', shadow: 'restlessness', verb: 'breaks the pattern', sphere: 'freedom, invention, and revolt', atBest: 'a genuine flash of the new', atWorst: 'change for the shock of it' },
  Neptune: { name: 'Neptune', noun: 'the pull toward the boundless', domain: 'dreams, compassion, and dissolution', gives: 'imagination and mercy', needs: 'something to merge with', shadow: 'illusion', verb: 'dissolves the edges', sphere: 'dream, faith, and imagination', atBest: 'compassion and vision without a wall around them', atWorst: 'a fog that hides what is real' },
  Pluto: { name: 'Pluto', noun: 'the force of transformation', domain: 'power, buried things, and rebirth', gives: 'depth and intensity', needs: 'something to remake', shadow: 'obsession', verb: 'transforms', sphere: 'power, depth, and rebirth', atBest: 'the power to remake yourself from the root', atWorst: 'a grip that cannot let go' },
  NorthNode: { name: 'the North Node', noun: 'the direction of growth', domain: 'the path being learned', gives: 'a pull toward the unfamiliar', needs: 'a step forward', shadow: 'avoidance', verb: 'points ahead', sphere: 'growth and the work of this life', atBest: 'the nerve to grow past what is comfortable', atWorst: 'avoiding the very thing that would help' },
  SouthNode: { name: 'the South Node', noun: 'the familiar past', domain: 'old talents and comfortable habits', gives: 'ease and instinct', needs: 'to be released', shadow: 'clinging', verb: 'looks back', sphere: 'inherited ease and old habit', atBest: 'a deep well of instinct to draw on', atWorst: 'clinging to what is safe and known' },
};

/** Fast to slow, for the transit/natal paragraph (the faster body triggers). */
const SPEED_ORDER: PointName[] = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'NorthNode', 'SouthNode', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';

/** FNV-1a hash to a stable bank index, seeded by slug + section. */
function pick<T>(bank: readonly T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return bank[Math.abs(h) % bank.length];
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ *
 *  ASPECT PAGES
 * ------------------------------------------------------------------ */

type Fn2 = (a: Voice, b: Voice) => string;
const HARD: ReadonlySet<AspectType> = new Set<AspectType>(['square', 'opposition']);

const OPENERS: Record<AspectType, readonly Fn2[]> = {
  conjunction: [
    (a, b) => `${cap(a.name)} conjunct ${b.name} sits both points at the same degree of the zodiac, so ${a.noun} and ${b.noun} act as a single force.`,
    (a, b) => `When ${a.name} and ${b.name} meet at the same point of the wheel, ${a.gives} fuses with ${b.gives}, for better and for worse.`,
    (a, b) => `The conjunction of ${a.name} and ${b.name} blends ${a.noun} with ${b.noun} until they are hard to tell apart.`,
  ],
  sextile: [
    (a, b) => `${cap(a.name)} sextile ${b.name} is an open door: ${a.noun} finds ${b.noun} easy to reach, for anyone who bothers to walk through.`,
    (a, b) => `Sixty degrees apart and in sympathetic elements, ${a.name} offers ${a.gives} to ${b.domain} without forcing anything.`,
    (a, b) => `The sextile puts ${a.name} and ${b.name} on friendly terms: an opportunity between ${a.noun} and ${b.noun} that rewards a little initiative.`,
  ],
  square: [
    (a, b) => `${cap(a.name)} square ${b.name} is friction with a purpose: ${a.noun} and ${b.noun} pull at right angles and press for a decision.`,
    (a, b) => `Ninety degrees of tension set ${a.gives} against ${b.gives}; the square is the aspect that forces the issue.`,
    (a, b) => `The square holds ${a.name} and ${b.name} at cross purposes, and that friction is meant to get the ball rolling rather than to sit still.`,
  ],
  trine: [
    (a, b) => `${cap(a.name)} trine ${b.name} flows: sharing an element, ${a.noun} and ${b.noun} reinforce each other almost without effort.`,
    (a, b) => `A hundred and twenty degrees apart, ${a.name} and ${b.name} move together so easily that ${a.gives} can be taken for granted.`,
    (a, b) => `The trine lets ${a.name} and ${b.name} cooperate by nature: ${a.noun} and ${b.noun} accept each other, which is a talent and a temptation to coast.`,
  ],
  opposition: [
    (a, b) => `${cap(a.name)} opposite ${b.name} sets ${a.noun} across the wheel from ${b.noun}: two half-truths looking for a balance.`,
    (a, b) => `Face to face at a hundred and eighty degrees, ${a.name} and ${b.name} each hold half of something, and the work is finding the point between ${a.gives} and ${b.gives}.`,
    (a, b) => `The opposition strings ${a.name} and ${b.name} along one axis, so each tends to be met out in the world, in other people, rather than owned within.`,
  ],
};

const ENERGIES: readonly Fn2[] = [
  (a, b) => `In this pairing ${a.name} carries ${a.sphere}, while ${b.name} carries ${b.sphere}. The aspect describes how those two departments of a life meet.`,
  (a, b) => `${cap(a.name)} governs ${a.sphere}; ${b.name} governs ${b.sphere}. Read the aspect as the working relationship between them.`,
  (a, b) => `${cap(a.name)} ${a.verb} where there is ${a.domain}; ${b.name} ${b.verb} where there is ${b.domain}. What follows is what happens when the two are tied together.`,
];

const COMBINATION: Record<AspectType, readonly Fn2[]> = {
  conjunction: [
    (a, b) => `Because they share a degree, you rarely feel one without the other: ${a.gives}, together with ${b.gives}, arrives as a single impulse, and it takes deliberate effort to separate them.`,
    (a, b) => `Fused, the two lose their edges. ${cap(a.needs)} and ${b.needs} become the same demand, which concentrates the pairing and also makes it hard to see clearly.`,
  ],
  sextile: [
    (a, b) => `The sextile offers a working relationship: when ${a.name} reaches toward ${b.domain}, the door is usually open, though someone still has to walk through it.`,
    (a, b) => `This is opportunity rather than gift. ${cap(a.gives)} is available to ${b.domain} on request, with a little more push behind it than a trine would give.`,
  ],
  square: [
    (a, b) => `The square keeps them at cross purposes: ${a.name} wants ${a.needs} while ${b.name} wants ${b.needs}, until a choice is made. Handled well, that pressure is the engine that gets things done.`,
    (a, b) => `Here ${a.gives} and ${b.gives} keep getting in each other's way. The tension is uncomfortable on purpose; it is there to force growth rather than to be resolved once and filed away.`,
  ],
  trine: [
    (a, b) => `The trine lets them cooperate almost without effort: ${a.gives} flows into ${b.domain} so naturally that the ease can be wasted for lack of a reason to use it.`,
    (a, b) => `These two simply agree. ${cap(a.noun)} supports ${b.noun} with no friction to speak of, which is a genuine talent and, being effortless, easy to overlook.`,
  ],
  opposition: [
    (a, b) => `The opposition places them on one axis, so ${a.name} tends to show up in the people and situations ${b.name} attracts. The task is to own both ends instead of casting one of them onto someone else.`,
    (a, b) => `Across this divide, ${a.needs} and ${b.needs} look like opposites, and the pull is to pick a side. The real work is holding both, since each carries half of the truth.`,
  ],
};

const BALANCE: Record<'soft' | 'hard' | 'conjunction', readonly Fn2[]> = {
  soft: [
    (a, b) => `At its best this reads as ${a.atBest} working alongside ${b.atBest}. The easy aspects ask little, so the risk is drift: ${a.atWorst}, left unchallenged because nothing pushes back.`,
    (a, b) => `Well used, it looks like ${a.atBest} and ${b.atBest} in quiet agreement. Poorly used, the same ease slides into ${a.atWorst}, since comfort rarely demands a correction.`,
  ],
  hard: [
    (a, b) => `At its best the friction produces ${a.atBest} tempered by ${b.atBest}. Under strain it slides toward ${a.atWorst} colliding with ${b.atWorst}, the same energy turned against itself.`,
    (a, b) => `Pushed in a good direction, it yields ${a.atBest} sharpened by ${b.atBest}. Pushed badly, it hardens into ${a.atWorst} set against ${b.atWorst}.`,
  ],
  conjunction: [
    (a, b) => `Blended, the pairing can express ${a.atBest} and ${b.atBest} in one gesture, or ${a.atWorst} and ${b.atWorst} just as seamlessly. Which one shows depends on how consciously it is handled.`,
    (a, b) => `As one force it is potent either way: ${a.atBest} joined to ${b.atBest} when it is owned, or ${a.atWorst} feeding ${b.atWorst} when it is not.`,
  ],
};

const TRANSIT_NATAL: readonly ((fast: Voice, slow: Voice, type: AspectType) => string)[] = [
  (fast, slow, type) => `As a transit, ${fast.name} moving to ${type} ${slow.name} marks a passing window, hours to days for the Moon, months or years for the slow outer bodies, when the theme is live and worth watching. In a birth chart the same aspect is a standing feature of character rather than a single moment.`,
  (fast, slow, type) => `Timing matters. When ${fast.name} forms this ${type} to ${slow.name} in the sky, it is a temporary weather system that comes and goes. Held in a natal chart, it describes something the person carries for life.`,
];

/** Faster-moving of the pair (drives the transit reading). */
function faster(a: PointName, b: PointName): [PointName, PointName] {
  return SPEED_ORDER.indexOf(a) <= SPEED_ORDER.indexOf(b) ? [a, b] : [b, a];
}

/**
 * Full aspect page body, fully generated: an array of paragraphs (opener
 * first). Node pairs get an honest, slightly shorter treatment (points, not
 * bodies) by dropping the best/strain paragraph, which reads forced for nodes.
 */
export function composeAspectParagraphs(a: PointName, type: AspectType, b: PointName): string[] {
  const va = VOICES[a], vb = VOICES[b];
  const slug = `${a}-${type}-${b}`;
  const out: string[] = [];
  out.push(pick(OPENERS[type], slug + '|open')(va, vb));
  out.push(pick(ENERGIES, slug + '|energy')(va, vb));
  out.push(pick(COMBINATION[type], slug + '|combo')(va, vb));
  if (!(isNode(a) || isNode(b))) {
    const band = type === 'conjunction' ? 'conjunction' : HARD.has(type) ? 'hard' : 'soft';
    out.push(pick(BALANCE[band], slug + '|bal')(va, vb));
  }
  const [f, s] = faster(a, b);
  out.push(pick(TRANSIT_NATAL, slug + '|time')(VOICES[f], VOICES[s], type));
  return out;
}

/** Opener only: the unique per-pair teaser (wheel tooltip / aspect-table row). */
export function composeAspectTeaser(a: PointName, type: AspectType, b: PointName): string {
  return pick(OPENERS[type], `${a}-${type}-${b}|open`)(VOICES[a], VOICES[b]);
}

/* ------------------------------------------------------------------ *
 *  PLANET-IN-SIGN PAGES
 * ------------------------------------------------------------------ */

type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
type Modality = 'Cardinal' | 'Fixed' | 'Mutable';
const ELEMENTS: readonly Element[] = ['Fire', 'Earth', 'Air', 'Water'];
const MODALITIES: readonly Modality[] = ['Cardinal', 'Fixed', 'Mutable'];

/** Tropical zodiac: element and modality follow position, so derive them. */
export function elementOf(sign: SignName): Element { return ELEMENTS[SIGNS.indexOf(sign) % 4]; }
export function modalityOf(sign: SignName): Modality { return MODALITIES[SIGNS.indexOf(sign) % 3]; }

const ELEMENT_KEY: Record<Element, string> = {
  Fire: 'a fast, outward, expressive key',
  Earth: 'a grounded, practical, slow-to-move key',
  Air: 'a mental, sociable, idea-first key',
  Water: 'a feeling, instinctive, tidal key',
};
const ELEMENT_ADJ: Record<Element, string> = { Fire: 'warm and direct', Earth: 'steady and concrete', Air: 'light and articulate', Water: 'deep and receptive' };
const MODALITY_LINE: Record<Modality, string> = {
  Cardinal: 'Being cardinal, it wants to start things and set them moving.',
  Fixed: 'Being fixed, it digs in, holds its position, and resists being moved.',
  Mutable: 'Being mutable, it bends, blends, and changes shape to fit the moment.',
};
const MODALITY_ADJ: Record<Modality, string> = { Cardinal: 'initiating', Fixed: 'persistent', Mutable: 'adaptable' };

const PIS_CORE: readonly ((v: Voice, sign: SignName, e: Element, m: Modality) => string)[] = [
  (v, sign, e) => `${cap(v.name)} in ${sign} places ${v.noun} in ${ELEMENT_KEY[e]}. ${MODALITY_LINE[modalityOf(sign)]}`,
  (v, sign, e) => `With ${v.name} in ${sign}, ${v.noun} takes on ${ELEMENT_KEY[e]}. ${MODALITY_LINE[modalityOf(sign)]}`,
];
const PIS_EXPRESS: readonly ((v: Voice, sign: SignName, e: Element, m: Modality) => string)[] = [
  (v, sign, e, m) => `Here ${v.sphere} runs ${ELEMENT_ADJ[e]} and ${MODALITY_ADJ[m]}: ${v.name} ${v.verb}, but in the ${sign} manner rather than any other.`,
  (v, sign, e, m) => `In ${sign}, expect ${v.sphere} to feel ${ELEMENT_ADJ[e]} and distinctly ${MODALITY_ADJ[m]}. The planet keeps its nature; the sign sets the style.`,
];
const PIS_BALANCE: readonly ((v: Voice, sign: SignName) => string)[] = [
  (v, sign) => `At its best that shows up as ${v.atBest}, expressed the ${sign} way. Under pressure it can tip into ${v.atWorst}.`,
  (v, sign) => `Well integrated, it looks like ${v.atBest} in a ${sign} register; strained, it slides toward ${v.atWorst}.`,
];

/** Full planet-in-sign body, fully generated: array of paragraphs. */
export function composePlanetInSignParagraphs(point: PointName, sign: SignName): string[] {
  const v = VOICES[point];
  const e = elementOf(sign), m = modalityOf(sign);
  const seed = `${point}-in-${sign}`;
  return [
    pick(PIS_CORE, seed + '|core')(v, sign, e, m),
    pick(PIS_EXPRESS, seed + '|expr')(v, sign, e, m),
    pick(PIS_BALANCE, seed + '|bal')(v, sign),
  ];
}

/** Teaser (first paragraph) for tooltips / metadata descriptions. */
export function composePlanetInSignTeaser(point: PointName, sign: SignName): string {
  return composePlanetInSignParagraphs(point, sign)[0];
}

/* ------------------------------------------------------------------ *
 *  SIGN PAGES (D5)
 * ------------------------------------------------------------------ */

/** Per-sign traditional attributes: clause banks, not per-page essays.
 *  Ruler display names derive from VOICES so sign and planet pages can
 *  never disagree about a ruler's name. */
interface SignTradition {
  ruler: PointName;
  rulerWhy: string;   // one clause: why the tradition assigns this ruler
  body: string;       // classical body-map (melothesia) association
  season: string;     // where the sign sits in the tropical year
  gift: string;       // the sign at its best
  shadow: string;     // the sign under strain
}

export const SIGN_TRADITION: Record<SignName, SignTradition> = {
  Aries: { ruler: 'Mars', rulerWhy: 'the planet of drive suits the sign that charges first', body: 'the head', season: 'it opens spring at the March equinox, the zodiac’s new year', gift: 'the nerve to begin', shadow: 'a fuse that burns too fast' },
  Taurus: { ruler: 'Venus', rulerWhy: 'the planet of pleasure suits the sign that savours what lasts', body: 'the neck and throat', season: 'it holds the middle of spring, when growth settles in', gift: 'patience that outlasts any storm', shadow: 'comfort hardening into stubbornness' },
  Gemini: { ruler: 'Mercury', rulerWhy: 'the messenger fits the sign of the quick, two-sided mind', body: 'the hands, arms, and lungs', season: 'it closes spring, restless before the solstice', gift: 'a mind that finds the connection first', shadow: 'attention scattered across too many threads' },
  Cancer: { ruler: 'Moon', rulerWhy: 'the tidal light fits the sign of shelter and memory', body: 'the chest and stomach', season: 'it opens summer at the June solstice', gift: 'care that makes a place feel safe', shadow: 'a shell that keeps out what it needs' },
  Leo: { ruler: 'Sun', rulerWhy: 'the source of light fits the sign that shines from the center', body: 'the heart and spine', season: 'it holds high summer, the year at full strength', gift: 'warmth that draws a room together', shadow: 'a hunger for applause' },
  Virgo: { ruler: 'Mercury', rulerWhy: 'the craft side of the messenger, sorting and refining', body: 'the belly and digestion', season: 'it closes summer with the harvest', gift: 'an eye for the fixable detail', shadow: 'criticism turned on itself' },
  Libra: { ruler: 'Venus', rulerWhy: 'the planet of harmony fits the sign of the balanced pair', body: 'the kidneys and lower back', season: 'it opens autumn at the September equinox, day and night in balance', gift: 'grace that finds the fair middle', shadow: 'a choice postponed forever' },
  Scorpio: { ruler: 'Mars', rulerWhy: 'the old rulership: the fighter turned inward, will under the surface', body: 'the organs of generation', season: 'it holds the deep of autumn, when the year turns inward', gift: 'loyalty that survives the depths', shadow: 'a grip that will not loosen' },
  Sagittarius: { ruler: 'Jupiter', rulerWhy: 'the expander fits the sign of the far horizon', body: 'the hips and thighs', season: 'it closes autumn, aiming past the year’s end', gift: 'faith that the road leads somewhere', shadow: 'a promise outrunning the plan' },
  Capricorn: { ruler: 'Saturn', rulerWhy: 'the timekeeper fits the sign of the long climb', body: 'the knees, bones, and skin', season: 'it opens winter at the December solstice, the longest night', gift: 'discipline that builds to last', shadow: 'ambition that forgets to rest' },
  Aquarius: { ruler: 'Saturn', rulerWhy: 'the traditional ruler: structure applied to the collective', body: 'the ankles and circulation', season: 'it holds midwinter, clear and far-seeing', gift: 'a view from outside the walls', shadow: 'detachment mistaken for wisdom' },
  Pisces: { ruler: 'Jupiter', rulerWhy: 'the traditional ruler: faith widened until the edges dissolve', body: 'the feet', season: 'it closes winter, dissolving the old year into the new', gift: 'compassion without a border', shadow: 'a tide that carries everything away' },
};

/** Fire and Air signs are the positive (outward) polarity; Earth and Water the negative (receptive). */
const POLARITY: Record<Element, string> = {
  Fire: 'positive, outward-turned half', Air: 'positive, outward-turned half',
  Earth: 'negative, receptive half', Water: 'negative, receptive half',
};

const SIGN_CORE: readonly ((sign: SignName, e: Element, m: Modality) => string)[] = [
  (sign, e, m) => `${sign} is the ${m.toLowerCase()} ${e.toLowerCase()} sign, belonging to the ${POLARITY[e]} of the zodiac: ${ELEMENT_KEY[e]}. ${MODALITY_LINE[m]}`,
  (sign, e, m) => `In the classical scheme ${sign} combines the ${e.toLowerCase()} element with the ${m.toLowerCase()} mode, on the ${POLARITY[e]} of the wheel: ${ELEMENT_KEY[e]}. ${MODALITY_LINE[m]}`,
];
const SIGN_TRAD: readonly ((sign: SignName, t: SignTradition) => string)[] = [
  (sign, t) => `The tropical zodiac keys ${sign} to the turning year: ${t.season}. Its traditional ruler is ${VOICES[t.ruler].name}, ${t.rulerWhy}. In the old body-map the sign governs ${t.body}.`,
  (sign, t) => `Season anchors the sign: ${t.season}. Tradition hands its rulership to ${VOICES[t.ruler].name}, ${t.rulerWhy}, and assigns it ${t.body} in the classical body-map.`,
];
const SIGN_BALANCE: readonly ((sign: SignName, t: SignTradition) => string)[] = [
  (sign, t) => `At its best ${sign} offers ${t.gift}. Under strain the same nature can become ${t.shadow}.`,
  (sign, t) => `Read well, ${sign} shows as ${t.gift}; read badly, it slides toward ${t.shadow}.`,
];

/** Full sign-page interpretive body, fully generated: array of paragraphs. */
export function composeSignParagraphs(sign: SignName): string[] {
  const t = SIGN_TRADITION[sign];
  const e = elementOf(sign), m = modalityOf(sign);
  const seed = `sign-${sign}`;
  return [
    pick(SIGN_CORE, seed + '|core')(sign, e, m),
    pick(SIGN_TRAD, seed + '|trad')(sign, t),
    pick(SIGN_BALANCE, seed + '|bal')(sign, t),
  ];
}

/* ------------------------------------------------------------------ *
 *  PLANET / POINT PAGES (D5)
 * ------------------------------------------------------------------ */

/** Per-point pace and retrograde cadence: observational facts phrased once. */
interface PointPace {
  perSign: string;  // time spent in one sign / around the wheel
  retro: string;    // retrograde cadence, or the honest note for lights and nodes
}

const PACE: Record<PointName, PointPace> = {
  Sun: { perSign: 'about a month in each sign and a year around the whole wheel', retro: 'It never turns retrograde: the Sun is the steady frame the other bodies loop against.' },
  Moon: { perSign: 'about two and a half days in each sign, the whole zodiac in under a month', retro: 'It never turns retrograde; it is simply the fastest thing on the wheel.' },
  Mercury: { perSign: 'from three to nine weeks in a sign, depending on its loops', retro: 'It turns retrograde three or four times a year for about three weeks at a time, the most famous retrograde of all.' },
  Venus: { perSign: 'about a month in each sign when moving direct', retro: 'It turns retrograde roughly every eighteen months, for about six weeks.' },
  Mars: { perSign: 'six or seven weeks in each sign', retro: 'It turns retrograde about every two years, for two to three months.' },
  Jupiter: { perSign: 'about a year in each sign, twelve years around the wheel', retro: 'It spends about four months of every year retrograde.' },
  Saturn: { perSign: 'about two and a half years in each sign, twenty-nine years for the circuit', retro: 'It spends about four and a half months of each year retrograde.' },
  Uranus: { perSign: 'about seven years in each sign, an eighty-four-year circuit', retro: 'It spends about five months of each year retrograde.' },
  Neptune: { perSign: 'about fourteen years in each sign, well over a century for the circuit', retro: 'It spends five to six months of each year retrograde.' },
  Pluto: { perSign: 'from twelve to thirty-one years in a sign on its stretched orbit, close to two and a half centuries for the circuit', retro: 'It spends five to six months of each year retrograde.' },
  NorthNode: { perSign: 'about eighteen months in each sign, a full circuit in eighteen and a half years', retro: 'The nodes always regress, moving backward through the zodiac, so no retrograde badge is shown for them.' },
  SouthNode: { perSign: 'about eighteen months in each sign, mirroring the North Node exactly opposite', retro: 'The nodes always regress, moving backward through the zodiac, so no retrograde badge is shown for them.' },
};

const PLANET_ARCH: readonly ((v: Voice) => string)[] = [
  (v) => `${cap(v.name)} is ${v.noun}: its territory is ${v.domain}. It gives ${v.gives}, it wants ${v.needs}, and its shadow is ${v.shadow}.`,
  (v) => `In the traditional scheme ${v.name} carries ${v.sphere}. It ${v.verb} wherever there is ${v.domain}; what it offers is ${v.gives}, what it looks for is ${v.needs}, and its failure mode is ${v.shadow}.`,
];
const PLANET_PACE: readonly ((v: Voice, p: PointPace) => string)[] = [
  (v, p) => `${cap(v.name)} spends ${p.perSign}. ${p.retro}`,
  (v, p) => `On the clock, ${v.name} takes ${p.perSign}. ${p.retro}`,
];
const PLANET_BALANCE: readonly ((v: Voice) => string)[] = [
  (v) => `Read well, ${v.name} shows as ${v.atBest}. Read badly, it slides toward ${v.atWorst}.`,
  (v) => `At its best ${v.name} gives ${v.atBest}; under strain the same force becomes ${v.atWorst}.`,
];

/** Full planet/point-page interpretive body, fully generated. */
export function composePlanetParagraphs(point: PointName): string[] {
  const v = VOICES[point];
  const seed = `planet-${point}`;
  return [
    pick(PLANET_ARCH, seed + '|arch')(v),
    pick(PLANET_PACE, seed + '|pace')(v, PACE[point]),
    pick(PLANET_BALANCE, seed + '|bal')(v),
  ];
}
