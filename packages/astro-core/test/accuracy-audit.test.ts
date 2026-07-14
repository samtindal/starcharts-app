import { describe, it, expect } from 'vitest';
import { longitudeAt, separation, type PointName } from '../src/index.js';

/**
 * E2 launch-gate accuracy audit (tasks/e2-qa-perf.md): chartAt() vs an
 * independent ephemeris for 12 dates spread across 1900-2100, all bodies,
 * 0.1° tolerance.
 *
 * Reference source: JPL Horizons (DE441), geocentric apparent ecliptic
 * longitude of date (QUANTITIES=31, CENTER=500@399, EPHEM_TYPE=OBSERVER),
 * which is the same frame astro-core targets (tropical, geocentric, true
 * ecliptic of date). Fetched 2026-07-13 via
 * https://ssd.jpl.nasa.gov/api/horizons.api; frozen here so the test stays
 * offline and deterministic rather than hitting a live API on every run.
 * Lunar nodes are excluded: Horizons has no node target body, and the mean
 * node is an analytic formula (not ephemeris-fitted), so it is covered by
 * the astronomical-invariant tests in core.test.ts instead.
 */
const HORIZONS_LON: Record<Exclude<PointName, 'NorthNode' | 'SouthNode'>, Record<string, number>> = {
  Sun: {
    '1900-03-15': 353.9685462, '1918-07-22': 118.3749519, '1936-11-03': 220.3925949,
    '1954-01-30': 309.564538, '1972-09-12': 169.3245753, '1990-05-05': 44.2497521,
    '2008-12-25': 273.563589, '2026-07-13': 110.645451, '2044-02-18': 328.9658602,
    '2062-10-09': 195.9972796, '2080-06-01': 71.4492326, '2100-04-04': 14.3112425,
  },
  Moon: {
    '1900-03-15': 159.3585384, '1918-07-22': 274.5812606, '1936-11-03': 92.3578935,
    '1954-01-30': 251.5676309, '1972-09-12': 217.8763183, '1990-05-05': 171.1132942,
    '2008-12-25': 246.3442506, '2026-07-13': 90.7718836, '2044-02-18': 207.2148075,
    '2062-10-09': 270.2436991, '2080-06-01': 233.4393538, '2100-04-04': 311.6794539,
  },
  Mercury: {
    '1900-03-15': 9.1443031, '1918-07-22': 141.5198487, '1936-11-03': 210.8938321,
    '1954-01-30': 320.1392815, '1972-09-12': 162.2400157, '1990-05-05': 42.6334061,
    '2008-12-25': 289.5186651, '2026-07-13': 110.7406063, '2044-02-18': 324.5280946,
    '2062-10-09': 181.8090116, '2080-06-01': 88.966802, '2100-04-04': 359.9845749,
  },
  Venus: {
    '1900-03-15': 34.9443556, '1918-07-22': 86.6905354, '1936-11-03': 253.2037499,
    '1954-01-30': 309.5616379, '1972-09-12': 124.2120801, '1990-05-05': 0.9397832,
    '2008-12-25': 319.4854181, '2026-07-13': 153.6364549, '2044-02-18': 13.0943161,
    '2062-10-09': 195.4978484, '2080-06-01': 74.766403, '2100-04-04': 54.9955538,
  },
  Mars: {
    '1900-03-15': 341.0864299, '1918-07-22': 194.4977748, '1936-11-03': 173.0044657,
    '1954-01-30': 233.8988676, '1972-09-12': 167.812408, '1990-05-05': 340.5179469,
    '2008-12-25': 268.2689993, '2026-07-13': 70.0158265, '2044-02-18': 179.0221261,
    '2062-10-09': 157.1732413, '2080-06-01': 270.9933797, '2100-04-04': 79.4099053,
  },
  Jupiter: {
    '1900-03-15': 250.6098489, '1918-07-22': 91.9214972, '1936-11-03': 263.8270374,
    '1954-01-30': 76.6340777, '1972-09-12': 268.974069, '1990-05-05': 97.6288445,
    '2008-12-25': 297.3272823, '2026-07-13': 122.7648359, '2044-02-18': 294.8517145,
    '2062-10-09': 151.9685149, '2080-06-01': 321.7458045, '2100-04-04': 198.8653598,
  },
  Saturn: {
    '1900-03-15': 274.2905376, '1918-07-22': 135.4612902, '1936-11-03': 346.0149996,
    '1954-01-30': 219.0626338, '1972-09-12': 80.2083025, '1990-05-05': 295.3389048,
    '2008-12-25': 171.7245213, '2026-07-13': 14.587261, '2044-02-18': 239.889396,
    '2062-10-09': 105.3949994, '2080-06-01': 315.5942665, '2100-04-04': 204.0214176,
  },
  Uranus: {
    '1900-03-15': 252.4788319, '1918-07-22': 326.8145099, '1936-11-03': 37.4674754,
    '1954-01-30': 110.2917517, '1972-09-12': 196.8705605, '1990-05-05': 279.4040673,
    '2008-12-25': 349.056458, '2026-07-13': 64.2748323, '2044-02-18': 139.7326265,
    '2062-10-09': 225.923093, '2080-06-01': 305.5370035, '2100-04-04': 21.199343,
  },
  Neptune: {
    '1900-03-15': 84.2349353, '1918-07-22': 126.5037609, '1936-11-03': 168.3230263,
    '1954-01-30': 206.0620296, '1972-09-12': 242.7108681, '1990-05-05': 284.4821432,
    '2008-12-25': 322.2302087, '2026-07-13': 4.4099328, '2044-02-18': 40.0350964,
    '2062-10-09': 85.3052029, '2080-06-01': 121.1521298, '2100-04-04': 165.2137507,
  },
  Pluto: {
    '1900-03-15': 74.7395029, '1918-07-22': 95.6219592, '1936-11-03': 118.7588932,
    '1954-01-30': 144.1378229, '1972-09-12': 181.4167508, '1990-05-05': 226.4613541,
    '2008-12-25': 271.0008678, '2026-07-13': 304.616345, '2044-02-18': 330.8051476,
    '2062-10-09': 353.9057392, '2080-06-01': 14.9267932, '2100-04-04': 33.3589595,
  },
};

const TOLERANCE_DEG = 0.1;

describe('accuracy audit vs JPL Horizons (launch gate)', () => {
  for (const body of Object.keys(HORIZONS_LON) as (keyof typeof HORIZONS_LON)[]) {
    for (const [dateStr, horizonsLon] of Object.entries(HORIZONS_LON[body])) {
      it(`${body} on ${dateStr} is within ${TOLERANCE_DEG}° of Horizons`, () => {
        const date = new Date(`${dateStr}T00:00:00Z`);
        const ours = longitudeAt(body, date);
        expect(separation(ours, horizonsLon)).toBeLessThan(TOLERANCE_DEG);
      });
    }
  }

  it('stays within a tenth of the tolerance in aggregate (regression guard)', () => {
    // The individual per-point tests above are the actual launch gate (0.1°);
    // this catches a systematic drift regression early, well before it would
    // threaten the real tolerance. Observed max at write time: ~0.019° (Moon,
    // 2100-04-04), the rest well under 0.005°.
    let maxDiff = 0;
    for (const body of Object.keys(HORIZONS_LON) as (keyof typeof HORIZONS_LON)[]) {
      for (const [dateStr, horizonsLon] of Object.entries(HORIZONS_LON[body])) {
        const date = new Date(`${dateStr}T00:00:00Z`);
        maxDiff = Math.max(maxDiff, separation(longitudeAt(body, date), horizonsLon));
      }
    }
    expect(maxDiff).toBeLessThan(0.05);
  });
});
