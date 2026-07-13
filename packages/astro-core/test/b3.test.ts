import { describe, it, expect } from 'vitest';
import {
  SearchMoonPhase, SearchLunarApsis, NextLunarApsis, AstroTime,
  Observer, Spherical, VectorFromSphere, Rotation_ECT_EQD, Rotation_EQD_HOR,
  HorizonFromVector, RotateVector,
} from '../src/ephemeris.js';
import {
  longitudeAt, positionAt, chartAt, detectAspects, separation, wrapDiff,
  orbFor, aspectStrength, rankAspects, ASPECT_TYPES, moonPhase, voidOfCourse,
  VOC_BODIES, SIGNS, signWindows,
  type AspectType,
} from '../src/index.js';
// houses.ts is engine-internal (not re-exported from index); import it directly.
import { ascendantMC, wholeSignHouses } from '../src/houses.js';

/* ------------------------------------------------------------------ *
 *  §1  Sun / Moon TRUE speed (correctness fix)
 * ------------------------------------------------------------------ */
describe('B3 §1: Sun/Moon true daily motion', () => {
  it('Moon speed exceeds 14.5°/day near perigee, under 12.5 near apogee', () => {
    // Walk the lunar apsides from a start date until we have one of each.
    let apsis = SearchLunarApsis(new Date('2026-01-01T00:00:00Z'));
    let perigee: Date | null = null, apogee: Date | null = null;
    for (let i = 0; i < 8 && (!perigee || !apogee); i++) {
      // kind 0 = pericenter (perigee), 1 = apocenter (apogee)
      if (apsis.kind === 0 && !perigee) perigee = apsis.time.date;
      if (apsis.kind === 1 && !apogee) apogee = apsis.time.date;
      apsis = NextLunarApsis(apsis);
    }
    expect(perigee).not.toBeNull();
    expect(apogee).not.toBeNull();
    expect(positionAt('Moon', perigee!).speed).toBeGreaterThan(14.5);
    expect(positionAt('Moon', apogee!).speed).toBeLessThan(12.5);
  });

  it('Sun speed exceeds 1.01°/day near perihelion, under 0.96 near aphelion', () => {
    expect(positionAt('Sun', new Date('2026-01-03T12:00:00Z')).speed).toBeGreaterThan(1.01);
    expect(positionAt('Sun', new Date('2026-07-04T12:00:00Z')).speed).toBeLessThan(0.96);
  });

  it('Moon/Sun speeds are true instantaneous motion, not a constant', () => {
    const a = positionAt('Moon', new Date('2026-01-03T00:00:00Z')).speed;
    const b = positionAt('Moon', new Date('2026-01-17T00:00:00Z')).speed;
    expect(Math.abs(a - b)).toBeGreaterThan(1); // varies across the month
  });

  it("applying flag agrees with the true change in orb (Moon aspect)", () => {
    // With true Moon speed, `applying` must match whether the orb is actually
    // shrinking an hour later. (Mean speed flips this near the Moon's extremes.)
    const d = new Date('2026-03-10T00:00:00Z');
    const asp = detectAspects(chartAt(d)).find((x) => x.a === 'Moon' || x.b === 'Moon');
    expect(asp).toBeDefined();
    const later = new Date(d.getTime() + 3600_000);
    const sepNow = separation(longitudeAt(asp!.a, d), longitudeAt(asp!.b, d));
    const sepLater = separation(longitudeAt(asp!.a, later), longitudeAt(asp!.b, later));
    const orbNow = Math.abs(sepNow - asp!.angle);
    const orbLater = Math.abs(sepLater - asp!.angle);
    expect(asp!.applying).toBe(orbLater < orbNow);
  });
});

/* ------------------------------------------------------------------ *
 *  §2  Luminary-weighted orbs
 * ------------------------------------------------------------------ */
describe('B3 §2: luminary-weighted orbs', () => {
  it('conjunction orb widens to 10° with a luminary, stays 8° without', () => {
    expect(orbFor('conjunction', 'Sun', 'Moon')).toBe(10);
    expect(orbFor('conjunction', 'Mercury', 'Saturn')).toBe(8);
  });
  it('a Sun–Moon pair at 9.5° is a conjunction; Mercury–Saturn at 9.5° is not', () => {
    const withLum = detectAspects([pos('Sun', 0), pos('Moon', 9.5)]);
    expect(withLum[0]?.type).toBe('conjunction');
    const withoutLum = detectAspects([pos('Mercury', 0), pos('Saturn', 9.5)]);
    expect(withoutLum).toHaveLength(0);
  });
  it('sextile orb is unchanged (5°) whether or not a luminary is involved', () => {
    expect(orbFor('sextile', 'Sun', 'Mars')).toBe(5);
    expect(orbFor('sextile', 'Mercury', 'Mars')).toBe(5);
  });
  it('base ASPECT_TYPES orbs are preserved (existing callers still read them)', () => {
    expect(ASPECT_TYPES.conjunction.orb).toBe(8);
    expect(ASPECT_TYPES.sextile.orb).toBe(5);
  });
});

/* ------------------------------------------------------------------ *
 *  §5  Moon phase
 * ------------------------------------------------------------------ */
describe('B3 §5: moon phase', () => {
  const from = new Date('2026-07-01T00:00:00Z');
  it('reads "new" with ~0 illumination at an exact new moon', () => {
    const nw = SearchMoonPhase(0, from, 40)!.date;
    const p = moonPhase(nw);
    expect(p.name).toBe('new');
    expect(p.illumination).toBeLessThan(0.02);
    expect(p.angle).toBeCloseTo(0, 0);
  });
  it('reads "full" with ~1 illumination at an exact full moon', () => {
    const full = SearchMoonPhase(180, from, 40)!.date;
    const p = moonPhase(full);
    expect(p.name).toBe('full');
    expect(p.illumination).toBeGreaterThan(0.98);
    expect(p.angle).toBeCloseTo(180, 0);
  });
  it('phase angle advances monotonically (mod 360) across a synodic month', () => {
    let prev = moonPhase(from).angle;
    let wraps = 0;
    for (let h = 6; h <= 30 * 24; h += 6) {
      const a = moonPhase(new Date(from.getTime() + h * 3600_000)).angle;
      const step = ((a - prev) % 360 + 360) % 360;
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThan(20); // ~3°/6h, never a backward jump
      if (a < prev) wraps++;
      prev = a;
    }
    expect(wraps).toBe(1); // exactly one 360→0 wrap in a month
  });
});

/* ------------------------------------------------------------------ *
 *  §6  Void-of-course Moon
 * ------------------------------------------------------------------ */
describe('B3 §6: void-of-course Moon', () => {
  const d = new Date('2026-07-07T12:00:00Z');
  const v = voidOfCourse(d);

  it('the aspect set is the modern ten bodies minus the Moon (nine)', () => {
    expect(VOC_BODIES).toHaveLength(9);
    expect(VOC_BODIES).not.toContain('Moon');
    expect(VOC_BODIES).not.toContain('NorthNode');
  });
  it('void ends exactly at a Moon sign ingress (degreeInSign ≈ 0)', () => {
    const deg = positionAt('Moon', v.until).degreeInSign;
    expect(Math.min(deg, 30 - deg)).toBeLessThan(0.05);
    expect(v.until.getTime()).toBeGreaterThan(d.getTime());
  });
  it('the sign the Moon is transiting is entered at a cusp, before it leaves', () => {
    const deg = positionAt('Moon', v.enteredSign).degreeInSign;
    expect(Math.min(deg, 30 - deg)).toBeLessThan(0.05);
    expect(v.enteredSign.getTime()).toBeLessThan(v.until.getTime());
  });
  it('no exact Moon aspect to the ten bodies occurs between `since` and `until`', () => {
    if (v.since === null) return; // void the whole sign (vacuously true)
    // Sample the open interval; assert no aspect-difference crosses an exact angle.
    const t0 = v.since.getTime() + 60_000, t1 = v.until.getTime() - 60_000;
    const angles = [0, 60, 90, 120, 180];
    let crossings = 0;
    const step = (t1 - t0) / 200;
    for (const body of VOC_BODIES) {
      for (const ang of angles) {
        for (const target of ang === 0 || ang === 180 ? [ang] : [ang, -ang]) {
          let prev = wrapDiff(longitudeAt('Moon', new Date(t0)) - longitudeAt(body, new Date(t0)) - target);
          for (let t = t0 + step; t <= t1; t += step) {
            const f = wrapDiff(longitudeAt('Moon', new Date(t)) - longitudeAt(body, new Date(t)) - target);
            if ((prev < 0) !== (f < 0) && Math.abs(f - prev) < 180) crossings++;
            prev = f;
          }
        }
      }
    }
    expect(crossings).toBe(0);
  });
  it('isVoid is consistent with since ≤ date', () => {
    if (v.since) expect(v.isVoid).toBe(d.getTime() >= v.since.getTime());
  });
});

/* ------------------------------------------------------------------ *
 *  §8  Ascendant / MC (independent horizon invariants)
 * ------------------------------------------------------------------ */
describe('B3 §8: Ascendant / MC', () => {
  // date, latitude (N+), longitude (E+); spans hemispheres & an eastern birth.
  const cases: Array<[string, number, number]> = [
    ['1990-03-15T14:30:00Z', 48.4, 10.0],   // Ulm, Germany (E)
    ['1969-07-20T20:17:00Z', -33.87, 151.21], // Sydney (S, far E)
    ['2000-01-01T00:00:00Z', 40.71, -74.0],  // New York (W)
  ];

  // Project an ecliptic-of-date longitude (lat 0) onto the local horizon.
  const horizon = (lonEcl: number, iso: string, lat: number, lonE: number) => {
    const t = new AstroTime(new Date(iso));
    const obs = new Observer(lat, lonE, 0);
    let v = VectorFromSphere(new Spherical(0, lonEcl, 1), t);
    v = RotateVector(Rotation_ECT_EQD(t), v);
    v = RotateVector(Rotation_EQD_HOR(t, obs), v);
    const h = HorizonFromVector(v, ''); // '' is falsy: no refraction, geometric horizon
    return { alt: h.lat, az: h.lon };
  };

  for (const [iso, lat, lonE] of cases) {
    it(`Ascendant rises on the eastern horizon (${iso})`, () => {
      const { ascendant } = ascendantMC(new Date(iso), lat, lonE);
      const h = horizon(ascendant, iso, lat, lonE);
      expect(Math.abs(h.alt)).toBeLessThan(1e-3);   // on the horizon
      expect(h.az).toBeGreaterThan(0);
      expect(h.az).toBeLessThan(180);               // eastern half
    });
    it(`MC lies on the local meridian (${iso})`, () => {
      const { mc } = ascendantMC(new Date(iso), lat, lonE);
      const h = horizon(mc, iso, lat, lonE);
      const dueMeridian = Math.min(Math.abs(h.az - 0), Math.abs(h.az - 180), Math.abs(h.az - 360));
      expect(dueMeridian).toBeLessThan(0.01);
    });
  }

  it('longitude is EAST-positive: flipping the sign moves the Ascendant', () => {
    const east = ascendantMC(new Date('2000-06-21T06:00:00Z'), 0, 100);
    const west = ascendantMC(new Date('2000-06-21T06:00:00Z'), 0, -100);
    expect(separation(east.ascendant, west.ascendant)).toBeGreaterThan(1);
  });

  it('Whole Sign houses start at the rising sign, 12 signs in order', () => {
    const { ascendant, ascSign } = ascendantMC(new Date('1990-03-15T14:30:00Z'), 48.4, 10.0);
    const houses = wholeSignHouses(ascendant);
    expect(houses).toHaveLength(12);
    expect(houses[0]).toBe(ascSign);
    expect(houses[6]).toBe(SIGNS[(SIGNS.indexOf(ascSign) + 6) % 12]);
  });
});

/* ------------------------------------------------------------------ *
 *  D3 support: signWindows (when a point occupies a sign)
 * ------------------------------------------------------------------ */
describe('signWindows (planet-in-sign calendar)', () => {
  const from = new Date('2026-07-08T00:00:00Z');
  it('reports the point currently in its actual sign', () => {
    const nowSign = positionAt('Sun', from).signIndex;
    expect(signWindows('Sun', nowSign, from, 2).current).toBe(true);
    const other = (nowSign + 3) % 12;
    expect(signWindows('Sun', other, from, 2).current).toBe(false);
  });
  it('window boundaries are real sign cusps for a fast body', () => {
    const nowSign = positionAt('Sun', from).signIndex;
    const { windows } = signWindows('Sun', (nowSign + 2) % 12, from, 1);
    expect(windows.length).toBeGreaterThan(0);
    const w = windows[0];
    if (w.enter) {
      const deg = positionAt('Sun', w.enter).degreeInSign;
      expect(Math.min(deg, 30 - deg)).toBeLessThan(0.05);
    }
    if (w.enter && w.exit) expect(w.exit.getTime()).toBeGreaterThan(w.enter.getTime());
  });
  it('slow body mid-transit: current with an open-ended (null exit or far) window', () => {
    const nowSign = positionAt('Pluto', from).signIndex;
    const r = signWindows('Pluto', nowSign, from, 1);
    expect(r.current).toBe(true);
    expect(r.windows[0].enter).toBeNull(); // entered before the scan window
  });
});

/* ------------------------------------------------------------------ *
 *  §9  Aspect-importance scoring
 * ------------------------------------------------------------------ */
describe('B3 §9: aspect-importance scoring', () => {
  const mk = (a: string, b: string, type: AspectType, orb: number, applying = false) => ({
    a: a as ReturnType<typeof chartAt>[number]['body'],
    b: b as ReturnType<typeof chartAt>[number]['body'],
    type, angle: ASPECT_TYPES[type].angle, orb, applying,
  });

  it('is strictly decreasing in orb, all else equal (orb is dominant)', () => {
    const tight = aspectStrength(mk('Sun', 'Mars', 'square', 1));
    const wide = aspectStrength(mk('Sun', 'Mars', 'square', 5));
    expect(tight).toBeGreaterThan(wide);
  });
  it('applying scores at least as high as separating', () => {
    expect(aspectStrength(mk('Sun', 'Mars', 'trine', 2, true)))
      .toBeGreaterThan(aspectStrength(mk('Sun', 'Mars', 'trine', 2, false)));
  });
  it('a conjunction outranks a sextile at identical orb and bodies', () => {
    expect(aspectStrength(mk('Venus', 'Mars', 'conjunction', 2)))
      .toBeGreaterThan(aspectStrength(mk('Venus', 'Mars', 'sextile', 2)));
  });
  it('luminary pair outranks a node pair at the same tightness fraction and type', () => {
    // Use exact aspects (orb 0) so tightness is 1 for both regardless of orbFor.
    expect(aspectStrength(mk('Sun', 'Moon', 'trine', 0)))
      .toBeGreaterThan(aspectStrength(mk('NorthNode', 'Venus', 'trine', 0)));
  });
  it('the fleeting Moon is down-weighted vs an equivalent non-Moon pairing', () => {
    // Same weights except the Moon penalty: Moon+Mars vs Sun+Mars (both bodyW avg
    // with a 1.0 luminary), exact trine. The Moon version must score lower.
    expect(aspectStrength(mk('Moon', 'Mars', 'trine', 0)))
      .toBeLessThan(aspectStrength(mk('Sun', 'Mars', 'trine', 0)));
  });
  it('the rare slow-pair boost tips a slow-slow aspect over an otherwise-heavier pairing', () => {
    // Saturn-Pluto (both slow -> rarity boost, but Pluto carries a lower body
    // weight than Mars) still edges Saturn-Mars: the boost is doing real work.
    expect(aspectStrength(mk('Saturn', 'Pluto', 'square', 0)))
      .toBeGreaterThan(aspectStrength(mk('Saturn', 'Mars', 'square', 0)));
  });
  it('importance, rarity, and aspect type outrank exactness (damped exactness)', () => {
    // A moderately wide Saturn-Pluto conjunction (heavy, rare, conjunct)
    // should outrank a near-exact Moon-Mercury sextile (fleeting, common, sextile).
    const saturnPluto = aspectStrength(mk('Saturn', 'Pluto', 'conjunction', 4.0));
    const moonMercury = aspectStrength(mk('Moon', 'Mercury', 'sextile', 0.1));
    expect(saturnPluto).toBeGreaterThan(moonMercury);
  });
  it('rankAspects orders a real chart strongest-first and is pure', () => {
    const asp = detectAspects(chartAt(new Date('2026-07-07T12:00:00Z')));
    const ranked = rankAspects(asp);
    for (let i = 1; i < ranked.length; i++) {
      expect(aspectStrength(ranked[i - 1])).toBeGreaterThanOrEqual(aspectStrength(ranked[i]));
    }
    expect(asp.length).toBe(ranked.length);        // did not drop any
    expect(rankAspects(asp)).toEqual(ranked);       // deterministic
  });

  /* mode-aware terms (owner spec 2026-07-08) */
  it('natal mode is a static snapshot: the applying flag does not change the score', () => {
    expect(aspectStrength(mk('Sun', 'Mars', 'square', 2, true), 'natal'))
      .toBe(aspectStrength(mk('Sun', 'Mars', 'square', 2, false), 'natal'));
  });
  it('natal mode ranks contacts with the lights highest', () => {
    expect(aspectStrength(mk('Sun', 'Mars', 'trine', 0), 'natal'))
      .toBeGreaterThan(aspectStrength(mk('Mercury', 'Mars', 'trine', 0), 'natal'));
  });
  it('transit-to-natal weights by the natal point being hit (b)', () => {
    // Same transiting Mars, same aspect/orb; a hit to natal Sun outranks natal Pluto.
    expect(aspectStrength(mk('Mars', 'Sun', 'square', 1, true), 'transit-to-natal'))
      .toBeGreaterThan(aspectStrength(mk('Mars', 'Pluto', 'square', 1, true), 'transit-to-natal'));
  });
  it('transit-to-natal keeps the time terms (applying beats separating)', () => {
    expect(aspectStrength(mk('Mars', 'Sun', 'square', 1, true), 'transit-to-natal'))
      .toBeGreaterThan(aspectStrength(mk('Mars', 'Sun', 'square', 1, false), 'transit-to-natal'));
  });
  it('synastry mode is static and favours luminary contacts', () => {
    expect(aspectStrength(mk('Sun', 'Venus', 'trine', 0, true), 'synastry'))
      .toBe(aspectStrength(mk('Sun', 'Venus', 'trine', 0, false), 'synastry'));   // time ignored
    expect(aspectStrength(mk('Sun', 'Venus', 'trine', 0), 'synastry'))
      .toBeGreaterThan(aspectStrength(mk('Mercury', 'Venus', 'trine', 0), 'synastry'));
  });
  it('mode changes the score (a transiting-Moon aspect differs transit vs natal)', () => {
    const a = mk('Moon', 'Mars', 'trine', 1);
    expect(aspectStrength(a, 'transit')).not.toBe(aspectStrength(a, 'natal'));
  });
});

/* helper: synthetic BodyPosition for orb tests (speed default keeps applying false) */
function pos(body: string, lon: number) {
  return {
    body: body as ReturnType<typeof chartAt>[number]['body'],
    lon, sign: 'Aries' as const, signIndex: 0, degreeInSign: lon % 30,
    retrograde: false, speed: 1,
  };
}
