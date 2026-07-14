import { describe, it, expect } from 'vitest';
import { Seasons, SearchMoonPhase, type AstroTime } from '../src/ephemeris.js';
import {
  longitudeAt, chartAt, isRetrograde, detectAspects, dateForLongitude,
  norm360, wrapDiff, separation, PLANETS, ASPECT_TYPES, nextExactAspectDates,
  crossAspects, MEAN_MOTION,
} from '../src/index.js';
// natal.ts is engine-internal (not re-exported from index); import it directly.
import { natalChart, transitAspects, synastry } from '../src/natal.js';
import type { AspectType } from '../src/index.js';
import type { BodyPosition } from '../src/index.js';

function fakePos(body: string, lon: number, speed = 1): BodyPosition {
  return {
    body: body as BodyPosition['body'], lon, sign: 'Aries', signIndex: 0,
    degreeInSign: lon % 30, retrograde: speed < 0, speed,
  };
}

describe('angles', () => {
  it('norm360 wraps negatives and overs', () => {
    expect(norm360(-10)).toBeCloseTo(350);
    expect(norm360(370)).toBeCloseTo(10);
    expect(norm360(720)).toBeCloseTo(0);
  });
  it('wrapDiff picks the short way', () => {
    expect(wrapDiff(350)).toBeCloseTo(-10);
    expect(wrapDiff(-350)).toBeCloseTo(10);
    expect(wrapDiff(180)).toBeCloseTo(180);
  });
  it('separation handles 0/360 wraparound', () => {
    expect(separation(358, 2)).toBeCloseTo(4);
    expect(separation(90, 270)).toBeCloseTo(180);
  });
});

describe('ecliptic frame is of-date (the astrology frame)', () => {
  // At the equinoxes/solstices the Sun's tropical longitude is exactly
  // 0/90/180/270 BY DEFINITION. If we were accidentally in the J2000 frame,
  // these would be off by ~0.36° (26 years of precession) and fail.
  const s = Seasons(2026);
  const cases: Array<[string, AstroTime, number]> = [
    ['March equinox', s.mar_equinox, 0],
    ['June solstice', s.jun_solstice, 90],
    ['September equinox', s.sep_equinox, 180],
    ['December solstice', s.dec_solstice, 270],
  ];
  for (const [name, time, expected] of cases) {
    it(`Sun at ${expected}° at ${name}`, () => {
      const lon = longitudeAt('Sun', time.date);
      expect(separation(lon, expected)).toBeLessThan(0.05);
    });
  }
});

describe('moon phase consistency', () => {
  it('Moon opposes Sun at full moon', () => {
    const full = SearchMoonPhase(180, new Date('2026-07-01T00:00:00Z'), 40);
    expect(full).not.toBeNull();
    const moon = longitudeAt('Moon', full!.date);
    const sun = longitudeAt('Sun', full!.date);
    expect(separation(moon, sun)).toBeGreaterThan(179.9);
  });
  it('Moon conjoins Sun at new moon', () => {
    const nw = SearchMoonPhase(0, new Date('2026-07-01T00:00:00Z'), 40);
    const moon = longitudeAt('Moon', nw!.date);
    const sun = longitudeAt('Sun', nw!.date);
    expect(separation(moon, sun)).toBeLessThan(0.1);
  });
});

describe('retrograde', () => {
  it('Sun and Moon are never retrograde', () => {
    for (let m = 0; m < 24; m++) {
      const d = new Date(Date.UTC(2025 + Math.floor(m / 12), m % 12, 15));
      expect(isRetrograde('Sun', d)).toBe(false);
      expect(isRetrograde('Moon', d)).toBe(false);
    }
  });
  it('Mercury is retrograde roughly 3 periods per year (~19% of days)', () => {
    let retroDays = 0;
    const total = 365;
    for (let i = 0; i < total; i++) {
      if (isRetrograde('Mercury', new Date(Date.UTC(2026, 0, 1 + i)))) retroDays++;
    }
    const frac = retroDays / total;
    expect(frac).toBeGreaterThan(0.12);
    expect(frac).toBeLessThan(0.28);
  });
});

describe('lunar nodes', () => {
  const d = new Date('2026-07-07T12:00:00Z');
  it('south node is exactly opposite north node', () => {
    expect(separation(longitudeAt('NorthNode', d), longitudeAt('SouthNode', d))).toBeCloseTo(180, 6);
  });
  it('node regresses at ~0.053°/day', () => {
    const later = new Date(d.getTime() + 30 * 86_400_000);
    const drift = wrapDiff(longitudeAt('NorthNode', later) - longitudeAt('NorthNode', d));
    expect(drift).toBeCloseTo(-0.05295376 * 30, 3);
  });
  it('nodes are never flagged retrograde (convention: unbadged)', () => {
    expect(isRetrograde('NorthNode', d)).toBe(false);
    expect(isRetrograde('SouthNode', d)).toBe(false);
  });
  it('detectAspects never reports the degenerate NN–SN opposition', () => {
    const aspects = detectAspects(chartAt(d));
    const degenerate = aspects.find(
      (a) => (a.a === 'NorthNode' || a.a === 'SouthNode') && (a.b === 'NorthNode' || a.b === 'SouthNode'),
    );
    expect(degenerate).toBeUndefined();
  });
});

describe('chartAt', () => {
  it('returns 12 points (10 bodies + nodes) with valid signs', () => {
    const chart = chartAt(new Date('2026-07-07T12:00:00Z'));
    expect(chart).toHaveLength(12);
    for (const p of chart) {
      expect(p.lon).toBeGreaterThanOrEqual(0);
      expect(p.lon).toBeLessThan(360);
      expect(p.degreeInSign).toBeGreaterThanOrEqual(0);
      expect(p.degreeInSign).toBeLessThan(30);
      expect(p.signIndex).toBe(Math.floor(p.lon / 30));
    }
  });
});

describe('aspect detection (synthetic)', () => {
  it('finds an exact opposition', () => {
    const aspects = detectAspects([fakePos('Sun', 10), fakePos('Mars', 190)]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('opposition');
    expect(aspects[0].orb).toBeCloseTo(0);
  });
  it('finds a trine across the 0° wraparound', () => {
    const aspects = detectAspects([fakePos('Venus', 350), fakePos('Moon', 110)]);
    expect(aspects[0].type).toBe('trine');
    expect(aspects[0].orb).toBeCloseTo(0);
  });
  it('respects orb limits', () => {
    // 60° aspect with 6° orb, outside sextile's 5° limit
    const aspects = detectAspects([fakePos('Sun', 0), fakePos('Moon', 66)]);
    expect(aspects).toHaveLength(0);
  });
  it('picks the nearest aspect type, not the first', () => {
    const aspects = detectAspects([fakePos('Sun', 0), fakePos('Moon', 88)]);
    expect(aspects[0].type).toBe('square');
    expect(aspects[0].orb).toBeCloseTo(2);
  });
});

describe('natal / transits / synastry', () => {
  const birth = new Date('1990-03-15T14:30:00Z');
  it('natal chart is just chartAt(birth) + its own aspects', () => {
    const n = natalChart(birth);
    expect(n.positions).toEqual(chartAt(birth));
    expect(n.aspects).toEqual(detectAspects(n.positions));
  });
  it('transit of a planet to its own natal position is a conjunction (orb 0)', () => {
    // At the birth instant itself, every transit is an exact conjunction
    // to its own natal position.
    const hits = transitAspects(birth, birth);
    for (const p of PLANETS) {
      const self = hits.find((a) => a.a === p && a.b === p);
      expect(self, `${p} self-conjunction`).toBeDefined();
      expect(self!.type).toBe('conjunction');
      expect(self!.orb).toBeLessThan(1e-9);
    }
  });
  it('synastry of a chart with itself finds those same conjunctions', () => {
    const s = synastry(birth, birth);
    for (const p of PLANETS) {
      const self = s.aspects.find((a) => a.a === p && a.b === p);
      expect(self!.type).toBe('conjunction');
    }
  });
  it('crossAspects respects orb limits (synthetic)', () => {
    const hits = crossAspects([fakePos('Sun', 0)], [fakePos('Moon', 66)]);
    expect(hits).toHaveLength(0); // 6° past sextile's 5° orb
    const hit = crossAspects([fakePos('Sun', 0)], [fakePos('Moon', 63)]);
    expect(hit[0].type).toBe('sextile');
  });
  it('applying flag: transiting body closing on a static natal point', () => {
    // Transiter at 87° moving +1°/day toward a square (90°) of natal 0°.
    const hits = crossAspects([fakePos('Mars', 87, 1)], [fakePos('Sun', 0, 1)], { staticB: true });
    expect(hits[0].type).toBe('square');
    expect(hits[0].applying).toBe(true);
    // Moving away: separating.
    const hits2 = crossAspects([fakePos('Mars', 93, 1)], [fakePos('Sun', 0, 1)], { staticB: true });
    expect(hits2[0].applying).toBe(false);
  });
});

describe('next exact aspect dates', () => {
  const from = new Date('2026-07-07T00:00:00Z');
  const ALL = Object.keys(ASPECT_TYPES) as AspectType[];

  it('every aspect type resolves, including the conjunction/opposition blind spot', () => {
    // Regression: separation() folds into [0,180], so `sep - 0` never goes
    // negative and `sep - 180` never goes positive. The old sign-change scan
    // returned ZERO dates for conjunction and opposition. Guard all five.
    for (const type of ALL) {
      const dates = nextExactAspectDates('Sun', type, 'Mars', from, 1400, 4);
      expect(dates.length, `${type} should have upcoming dates`).toBeGreaterThan(0);
      for (const d of dates) {
        const sep = separation(longitudeAt('Sun', d), longitudeAt('Mars', d));
        expect(sep, `${type} at ${d.toISOString()}`).toBeCloseTo(ASPECT_TYPES[type].angle, 1);
      }
    }
  });

  it('specifically finds Sun–Mars conjunctions and oppositions', () => {
    expect(nextExactAspectDates('Sun', 'conjunction', 'Mars', from, 1400, 4).length).toBeGreaterThan(0);
    expect(nextExactAspectDates('Sun', 'opposition', 'Mars', from, 1400, 4).length).toBeGreaterThan(0);
  });

  it('returns dates ascending and inside the span', () => {
    const span = 120;
    const dates = nextExactAspectDates('Moon', 'conjunction', 'Sun', from, span, 4);
    expect(dates.length).toBeGreaterThan(1); // new moon is ~monthly
    const end = from.getTime() + span * 86_400_000;
    for (let i = 0; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(dates[i].getTime()).toBeLessThanOrEqual(end);
      if (i > 0) expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });

  it('honours maxHits and does not emit near-duplicate instants', () => {
    const dates = nextExactAspectDates('Moon', 'square', 'Sun', from, 365, 3);
    expect(dates.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime() - dates[i - 1].getTime()).toBeGreaterThan(6 * 3600 * 1000);
    }
  });
});

describe('inverse solver (drag → date)', () => {
  const near = new Date('2026-07-07T00:00:00Z');
  for (const planet of ['Moon', 'Sun', 'Mars', 'Jupiter', 'Pluto', 'NorthNode'] as const) {
    it(`round-trips ${planet} +30 days`, () => {
      const future = new Date(near.getTime() + 30 * 86_400_000);
      const target = longitudeAt(planet, future);
      const solved = dateForLongitude(planet, target, near);
      const lonSolved = longitudeAt(planet, solved);
      expect(separation(lonSolved, target)).toBeLessThan(0.01);
    });
  }
  it('stays nearest-in-time for the Moon (no month skips)', () => {
    const future = new Date(near.getTime() + 2 * 86_400_000);
    const target = longitudeAt('Moon', future);
    const solved = dateForLongitude('Moon', target, near);
    // Should land ~2 days out, not 2 days + a lunar month
    expect(Math.abs(solved.getTime() - future.getTime())).toBeLessThan(86_400_000);
  });
  it('simulated drags converge every frame with ≤1 direction flip', () => {
    // Regression: Mercury is retrograde on this date; the naive Newton
    // solver failed to converge dragging prograde and Pluto jittered
    // between time branches. See PLAN.md §4.
    for (const [planet, total, step] of [['Mercury', 20, 0.5], ['Pluto', 2, 0.1], ['Moon', 30, 1]] as const) {
      let date = new Date('2026-07-07T12:00:00Z');
      let lon = longitudeAt(planet, date);
      let dir: -1 | 0 | 1 = 0, flips = 0;
      for (let i = 0; i < total / step; i++) {
        lon = norm360(lon + step);
        const next = dateForLongitude(planet, lon, date, dir);
        const d = Math.sign(next.getTime() - date.getTime()) as -1 | 0 | 1;
        if (d !== 0 && dir !== 0 && d !== dir) flips++;
        if (d !== 0) dir = d;
        date = next;
        expect(separation(longitudeAt(planet, date), lon)).toBeLessThan(0.01);
      }
      expect(flips).toBeLessThanOrEqual(1);
    }
  });

  it('converges through a Mercury station without era jumps', () => {
    // Scan 2026 for a station, then solve near it.
    let station: Date | null = null;
    for (let i = 1; i < 365 && !station; i++) {
      const a = isRetrograde('Mercury', new Date(Date.UTC(2026, 0, i)));
      const b = isRetrograde('Mercury', new Date(Date.UTC(2026, 0, i + 1)));
      if (a !== b) station = new Date(Date.UTC(2026, 0, i));
    }
    expect(station).not.toBeNull();
    const target = longitudeAt('Mercury', station!);
    const solved = dateForLongitude('Mercury', target, new Date(station!.getTime() + 5 * 86_400_000));
    expect(separation(longitudeAt('Mercury', solved), target)).toBeLessThan(0.01);
    // Within ±60 days of the station, not another year
    expect(Math.abs(solved.getTime() - station!.getTime())).toBeLessThan(60 * 86_400_000);
  });

  it('converges through a Mercury station without era jumps, across 12 years spread 1900-2100', () => {
    // Same check as above, but repeated across the same 12 years the
    // accuracy audit spans (E2: "fuzz targetLon × date"), not just 2026.
    for (const year of [1900, 1918, 1936, 1954, 1972, 1990, 2008, 2026, 2044, 2062, 2080, 2100]) {
      let station: Date | null = null;
      for (let i = 1; i < 365 && !station; i++) {
        const a = isRetrograde('Mercury', new Date(Date.UTC(year, 0, i)));
        const b = isRetrograde('Mercury', new Date(Date.UTC(year, 0, i + 1)));
        if (a !== b) station = new Date(Date.UTC(year, 0, i));
      }
      expect(station, `no station found in ${year}`).not.toBeNull();
      const target = longitudeAt('Mercury', station!);
      const solved = dateForLongitude('Mercury', target, new Date(station!.getTime() + 5 * 86_400_000));
      expect(separation(longitudeAt('Mercury', solved), target), `${year} convergence`).toBeLessThan(0.01);
      expect(Math.abs(solved.getTime() - station!.getTime()), `${year} era jump`).toBeLessThan(60 * 86_400_000);
    }
  });

  it('fuzz: converges and stays nearest-in-time for random planet x date x small target offset', () => {
    // Deterministic PRNG (mulberry32) so a failure is reproducible from the
    // seed alone, not a flaky one-off.
    let seed = 0xC0FFEE;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const EPOCH_1900 = Date.UTC(1900, 0, 1);
    const EPOCH_2100 = Date.UTC(2100, 0, 1);

    for (let trial = 0; trial < 300; trial++) {
      const planet = PLANETS[Math.floor(rand() * PLANETS.length)];
      const near = new Date(EPOCH_1900 + rand() * (EPOCH_2100 - EPOCH_1900));
      // A drag-sized step (±15°), like one frame of the pointer drag, not an
      // arbitrary target anywhere on the wheel.
      const target = norm360(longitudeAt(planet, near) + (rand() * 30 - 15));
      const solved = dateForLongitude(planet, target, near);

      expect(separation(longitudeAt(planet, solved), target), `${planet} @ ${near.toISOString()} convergence`)
        .toBeLessThan(0.02);
      // Nearest-in-time: a small target nudge should resolve within a few
      // synodic periods, never jump an unrelated era. Generous bound (20
      // synodic periods, floor 5 years) absorbs retrograde-loop searches
      // without masking a genuine "wrong era" bug.
      const synodicMs = (360 / MEAN_MOTION[planet]) * 86_400_000;
      const bound = Math.max(20 * synodicMs, 5 * 365 * 86_400_000);
      expect(Math.abs(solved.getTime() - near.getTime()), `${planet} @ ${near.toISOString()} nearest-in-time`)
        .toBeLessThan(bound);
    }
  });
});
