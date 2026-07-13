/**
 * Ascendant / Midheaven (B3 §8), the math behind the rising sign (C3). No UI,
 * no house SYSTEMS: Whole Sign is the only house model implied here (1st house =
 * the whole rising sign). Placidus/Equal stay deferred (PLAN.md P3).
 *
 * Longitude convention is EAST-POSITIVE (lonEastDeg): +10 = 10degE, -74 = 74degW.
 * The Ascendant is defined at every latitude, so no polar fallback is needed
 * for Whole Sign (only Placidus breaks near the poles).
 */
import { norm360 } from './angles.js';
import { SIGNS, type SignName } from './positions.js';
import { SiderealTime, e_tilt, AstroTime } from './ephemeris.js';

const DEG = Math.PI / 180;
const signOf = (lon: number): SignName => SIGNS[Math.floor(norm360(lon) / 30) % 12];

export interface AscendantMC {
  /** Ascendant ecliptic longitude, degrees [0,360). */
  ascendant: number;
  /** Midheaven (MC) ecliptic longitude, degrees [0,360). */
  mc: number;
  ascSign: SignName;
  mcSign: SignName;
}

/**
 * Ascendant and MC for an instant and place.
 * @param date        UTC instant (the local->UTC conversion is C3's job).
 * @param latDeg      geographic latitude, degrees north-positive.
 * @param lonEastDeg  geographic longitude, degrees EAST-positive.
 */
export function ascendantMC(date: Date, latDeg: number, lonEastDeg: number): AscendantMC {
  const time = new AstroTime(date);
  // Local sidereal time -> right ascension of the meridian (RAMC), degrees.
  const gstHours = SiderealTime(time);           // Greenwich sidereal time, hours
  const lstHours = (gstHours + lonEastDeg / 15);  // local sidereal time, hours
  const ramc = norm360(lstHours * 15);
  const eps = e_tilt(time).tobl * DEG;            // true obliquity of date, radians
  const ra = ramc * DEG;
  const phi = latDeg * DEG;

  // MC: ecliptic longitude on the meridian. atan2 keeps it in RAMC's hemisphere.
  const mc = norm360((Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps))) / DEG);

  // Ascendant: the rising (eastern) ecliptic point.
  const asc = norm360(
    (Math.atan2(
      Math.cos(ra),
      -(Math.sin(ra) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
    )) / DEG,
  );

  return { ascendant: asc, mc, ascSign: signOf(asc), mcSign: signOf(mc) };
}

/**
 * Whole Sign houses: 12 sign names in zodiacal order starting from the sign of
 * the Ascendant. houses[0] is the 1st house (= the whole rising sign). This is
 * the ONLY house model in v1; there are no cusp degrees because Whole Sign has
 * none (each house is an entire sign).
 */
export function wholeSignHouses(ascendant: number): SignName[] {
  const start = Math.floor(norm360(ascendant) / 30) % 12;
  return Array.from({ length: 12 }, (_, i) => SIGNS[(start + i) % 12]);
}
