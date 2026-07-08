/**
 * Single point of contact with astronomy-engine.
 *
 * astronomy-engine ships as CommonJS, and the two runtimes we care about
 * disagree about its shape: vitest (vite) exposes named exports with no
 * usable `default`, while plain node/tsx exposes everything on `default`
 * only (Node's CJS export detection fails on this package). The namespace
 * import + `default ?? namespace` fallback works in both. Import ephemeris
 * symbols from THIS module, never from 'astronomy-engine' directly.
 */
import * as ns from 'astronomy-engine';

const astronomy: typeof ns = (ns as unknown as { default?: typeof ns }).default ?? ns;

export const Body = astronomy.Body;
export const GeoVector = astronomy.GeoVector;
export const Ecliptic = astronomy.Ecliptic;
export const EclipticGeoMoon = astronomy.EclipticGeoMoon;
export const Seasons = astronomy.Seasons;
export const SearchMoonPhase = astronomy.SearchMoonPhase;

export type { AstroTime } from 'astronomy-engine';
export type Body = ns.Body;
