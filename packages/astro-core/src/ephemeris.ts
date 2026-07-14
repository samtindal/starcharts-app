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

// Read `default` through a computed key, not `ns.default`, so webpack (Next)
// does not statically flag "no default export" on this CJS module. Runtime is
// identical in all three targets: vitest/webpack have no `default` (fall back
// to the namespace), node/tsx expose everything on `default` (use it).
const DEFAULT_KEY = 'default';
const astronomy: typeof ns =
  (ns as unknown as Record<string, typeof ns | undefined>)[DEFAULT_KEY] ?? ns;

export const Body = astronomy.Body;
export const GeoVector = astronomy.GeoVector;
export const Ecliptic = astronomy.Ecliptic;
export const EclipticGeoMoon = astronomy.EclipticGeoMoon;
export const Seasons = astronomy.Seasons;
export const SearchMoonPhase = astronomy.SearchMoonPhase;

// B3 additions. Still the single point of contact with astronomy-engine.
export const AstroTime = astronomy.AstroTime;
export const Vector = astronomy.Vector;
/** Osculating geocentric Moon state (position + velocity), EQJ frame. */
export const GeoMoonState = astronomy.GeoMoonState;
/** Rotation matrix J2000 mean equator -> true ecliptic of date (astrology frame). */
export const Rotation_EQJ_ECT = astronomy.Rotation_EQJ_ECT;
export const RotateVector = astronomy.RotateVector;
/** Greenwich sidereal time in hours [0,24). */
export const SiderealTime = astronomy.SiderealTime;
/** Earth tilt: `.tobl` is the true obliquity of date in degrees. */
export const e_tilt = astronomy.e_tilt;
/** Physically exact illuminated fraction (`.phase_fraction`) and phase angle. */
export const Illumination = astronomy.Illumination;
export const SearchLunarApsis = astronomy.SearchLunarApsis;
export const NextLunarApsis = astronomy.NextLunarApsis;

// Horizontal-coordinate helpers. Used by the Ascendant/MC invariant tests
// (project a point onto the local horizon to prove it rises / culminates);
// also available to any consumer needing alt/az.
export const Observer = astronomy.Observer;
export const Spherical = astronomy.Spherical;
export const VectorFromSphere = astronomy.VectorFromSphere;
export const Rotation_ECT_EQD = astronomy.Rotation_ECT_EQD;
export const Rotation_EQD_HOR = astronomy.Rotation_EQD_HOR;
export const HorizonFromVector = astronomy.HorizonFromVector;

// AstroTime is exported as a VALUE above (the class, used via `new AstroTime`);
// declare the instance TYPE under the same name so both `AstroTime` positions work.
export type AstroTime = ns.AstroTime;
export type Body = ns.Body;
export type StateVector = ns.StateVector;
