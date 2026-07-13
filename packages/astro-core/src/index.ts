export { norm360, wrapDiff, separation } from './angles.js';
export {
  PLANETS, NODES, POINTS, SIGNS, MEAN_MOTION, NODE_RATE,
  longitudeAt, dailyMotion, isRetrograde, positionAt, chartAt,
} from './positions.js';
export type { PlanetName, NodeName, PointName, SignName, BodyPosition } from './positions.js';
export { ASPECT_TYPES, orbFor, aspectStrength, rankAspects, detectAspects, crossAspects } from './aspects.js';
export type { AspectType, Aspect, StrengthMode } from './aspects.js';
export { dateForLongitude } from './solver.js';
export { nextExactAspectDates, lastExactAspectDate, aspectStrengthTimeline, signWindows } from './events.js';
export type { SignWindow, StrengthSample, StrengthTimeline } from './events.js';
export { moonPhase, voidOfCourse, VOC_BODIES } from './moon.js';
export type { MoonPhase, PhaseName, VoidOfCourse } from './moon.js';
export {
  VOICES, SIGN_TRADITION, composeAspectParagraphs, composeAspectTeaser,
  composePlanetInSignParagraphs, composePlanetInSignTeaser,
  composeSignParagraphs, composePlanetParagraphs, elementOf, modalityOf,
} from './interpret.js';
export type { Voice } from './interpret.js';
// natal.ts (natalChart, transitAspects, synastry) and houses.ts (ascendantMC,
// wholeSignHouses) are birth-data math, deferred to P2. They stay in the package
// but are NOT re-exported, so nothing outside astro-core can reach them (v1 ships
// date scrubbing only). P2 re-enable is a one-line export change. Their own tests
// import them directly from './natal.js' / './houses.js'.
