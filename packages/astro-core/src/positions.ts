import { Body, GeoVector, Ecliptic, EclipticGeoMoon } from './ephemeris.js';
import { norm360, wrapDiff } from './angles.js';

export const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
] as const;
export type PlanetName = (typeof PLANETS)[number];

export const NODES = ['NorthNode', 'SouthNode'] as const;
export type NodeName = (typeof NODES)[number];

/** Every point that appears on the wheel: ten bodies + the lunar nodes. */
export const POINTS = [...PLANETS, ...NODES] as const;
export type PointName = PlanetName | NodeName;

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type SignName = (typeof SIGNS)[number];

const BODY: Record<PlanetName, Body> = {
  Sun: Body.Sun, Moon: Body.Moon, Mercury: Body.Mercury, Venus: Body.Venus,
  Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn,
  Uranus: Body.Uranus, Neptune: Body.Neptune, Pluto: Body.Pluto,
};

const isNode = (p: PointName): p is NodeName => p === 'NorthNode' || p === 'SouthNode';

/** Mean node regression rate, deg/day (nodes travel backward through the zodiac). */
export const NODE_RATE = -0.05295376;

/**
 * Approximate mean geocentric motion MAGNITUDE, degrees/day
 * (used for solver step scaling).
 */
export const MEAN_MOTION: Record<PointName, number> = {
  Sun: 0.9856, Moon: 13.176, Mercury: 1.383, Venus: 1.2, Mars: 0.524,
  Jupiter: 0.0831, Saturn: 0.0334, Uranus: 0.0117, Neptune: 0.006, Pluto: 0.004,
  NorthNode: -NODE_RATE, SouthNode: -NODE_RATE,
};

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DAY_MS = 86_400_000;

/**
 * Mean lunar node (Meeus). The "true" (osculating) node wobbles up to
 * ~1.75° around this; astrology accepts either — we use MEAN and say so.
 * Referred to the mean equinox of date, which is what the tropical
 * zodiac wants. (TT−UTC ≈ 1 min ⇒ error ~4e-5°, ignorable.)
 */
function meanNodeLongitude(date: Date): number {
  const d = (date.getTime() - J2000_MS) / DAY_MS;
  return norm360(125.04452 + NODE_RATE * d);
}

/**
 * Tropical geocentric ecliptic longitude (true ecliptic of date), degrees [0,360).
 * astronomy-engine's Ecliptic() converts a J2000 equatorial vector to true
 * ecliptic of date, which is the frame astrology uses.
 */
export function longitudeAt(point: PointName, date: Date): number {
  if (point === 'NorthNode') return meanNodeLongitude(date);
  if (point === 'SouthNode') return norm360(meanNodeLongitude(date) + 180);
  if (point === 'Moon') return norm360(EclipticGeoMoon(date).lon);
  const vec = GeoVector(BODY[point], date, true /* correct for aberration */);
  return norm360(Ecliptic(vec).elon);
}

/** Apparent daily motion in deg/day at `date` (negative while retrograde). */
export function dailyMotion(point: PointName, date: Date): number {
  const halfDayMs = 43_200_000;
  const before = longitudeAt(point, new Date(date.getTime() - halfDayMs));
  const after = longitudeAt(point, new Date(date.getTime() + halfDayMs));
  return wrapDiff(after - before);
}

export function isRetrograde(point: PointName, date: Date): boolean {
  // Sun/Moon never retrograde; nodes are ALWAYS regressing, so flagging
  // them would be noise — chart convention leaves nodes unbadged.
  if (point === 'Sun' || point === 'Moon' || isNode(point)) return false;
  return dailyMotion(point, date) < 0;
}

export interface BodyPosition {
  body: PointName;
  /** Ecliptic longitude, degrees [0,360) */
  lon: number;
  sign: SignName;
  signIndex: number;
  /** Degrees into the sign, [0,30) */
  degreeInSign: number;
  retrograde: boolean;
  /** deg/day, negative when retrograde (nodes: always negative) */
  speed: number;
}

export function positionAt(point: PointName, date: Date): BodyPosition {
  const lon = longitudeAt(point, date);
  const signIndex = Math.floor(lon / 30) % 12;
  const speed = isNode(point)
    ? NODE_RATE
    : point === 'Sun' || point === 'Moon'
      ? MEAN_MOTION[point]
      : dailyMotion(point, date);
  return {
    body: point,
    lon,
    sign: SIGNS[signIndex],
    signIndex,
    degreeInSign: lon - signIndex * 30,
    retrograde: isRetrograde(point, date) && speed < 0,
    speed,
  };
}

/** Full chart: ten bodies + both lunar nodes at an instant. */
export function chartAt(date: Date): BodyPosition[] {
  return POINTS.map((p) => positionAt(p, date));
}
