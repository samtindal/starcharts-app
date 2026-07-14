import { describe, it, expect } from 'vitest';
import { describePositions, describeAspects, chartPayload, ATTRIBUTION } from '../src/format.js';
import type { Aspect, BodyPosition } from '@starcharts/astro-core';

const pos = (
  body: string, lon: number, sign: string, degreeInSign: number, retrograde = false,
): BodyPosition => ({
  body: body as BodyPosition['body'],
  lon,
  sign: sign as BodyPosition['sign'],
  signIndex: 0,
  degreeInSign,
  retrograde,
  speed: retrograde ? -1 : 1,
});

const asp = (
  a: string, b: string, type: Aspect['type'], angle: number, orb: number, applying: boolean,
): Aspect => ({ a: a as Aspect['a'], b: b as Aspect['b'], type, angle, orb, applying });

describe('describePositions', () => {
  it('formats degrees, arcminutes, sign, and retrograde flag', () => {
    const out = describePositions([pos('Sun', 100.5, 'Cancer', 10.5)]);
    expect(out).toBe('Sun at 10°30′ Cancer');
  });
  it('expands CamelCase point names and marks retrograde', () => {
    const out = describePositions([pos('NorthNode', 5, 'Aries', 5, true)]);
    expect(out).toContain('North Node');
    expect(out).toContain('(retrograde)');
  });
  it('joins multiple bodies with semicolons', () => {
    const out = describePositions([pos('Sun', 0, 'Aries', 0), pos('Moon', 30, 'Taurus', 0)]);
    expect(out).toBe('Sun at 0°00′ Aries; Moon at 0°00′ Taurus');
  });
});

describe('describeAspects', () => {
  it('reports the empty case', () => {
    expect(describeAspects([])).toBe('No major aspects in orb.');
  });
  it('includes type, orb, and applying tag', () => {
    const out = describeAspects([asp('Sun', 'Mars', 'trine', 120, 1.23, true)]);
    expect(out).toBe('Sun trine Mars (orb 1.2°, applying)');
  });
  it('omits the applying tag when separating', () => {
    const out = describeAspects([asp('Sun', 'Mars', 'square', 90, 2, false)]);
    expect(out).toBe('Sun square Mars (orb 2.0°)');
  });
  it('applies cross-chart labels (transits, synastry)', () => {
    const out = describeAspects([asp('Mars', 'Venus', 'opposition', 180, 0.5, false)], ['transiting', 'natal']);
    expect(out).toBe('transiting Mars opposition natal Venus (orb 0.5°)');
  });
});

describe('chartPayload', () => {
  const date = new Date('2026-07-07T12:00:00Z');
  const positions = [pos('Sun', 105.4321, 'Cancer', 15.4321)];
  const aspects = [asp('Sun', 'Moon', 'conjunction', 0, 0.87, true)];

  it('rounds numbers and carries structured fields', () => {
    const p = chartPayload(date, positions, aspects);
    expect(p.date).toBe('2026-07-07T12:00:00.000Z');
    expect(p.positions[0]).toMatchObject({ body: 'Sun', sign: 'Cancer', retrograde: false });
    expect(p.positions[0].longitude).toBeCloseTo(105.4321, 4);
    expect(p.positions[0].degreeInSign).toBeCloseTo(15.43, 2);
    expect(p.aspects[0]).toMatchObject({ a: 'Sun', b: 'Moon', type: 'conjunction', applying: true });
    expect(p.aspects[0].orb).toBeCloseTo(0.87, 2);
  });

  it('embeds a human summary with attribution', () => {
    const p = chartPayload(date, positions, aspects);
    expect(p.summary).toContain('Sun at 15°26′ Cancer');
    expect(p.summary).toContain('Sun conjunction Moon');
    expect(p.summary).toContain(ATTRIBUTION);
  });
});
