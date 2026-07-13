import { describe, it, expect } from 'vitest';
import {
  nextExactAspectDates, lastExactAspectDate, aspectStrengthTimeline,
  longitudeAt, wrapDiff,
} from '../src/index.js';

/** Astronomical invariants, not snapshots (repo test rule). */
describe('lastExactAspectDate', () => {
  const ref = new Date(Date.UTC(2026, 5, 1));

  it('finds the last new moon within one lunation before the reference date', () => {
    const d = lastExactAspectDate('Sun', 'conjunction', 'Moon', ref);
    expect(d).not.toBeNull();
    const daysBefore = (ref.getTime() - d!.getTime()) / 86_400_000;
    expect(daysBefore).toBeGreaterThan(0);
    expect(daysBefore).toBeLessThan(30);
    // At the hit, the pair really is at the exact angle.
    const sep = Math.abs(wrapDiff(longitudeAt('Sun', d!) - longitudeAt('Moon', d!)));
    expect(sep).toBeLessThan(0.01);
  });

  it('agrees with the forward scanner run from just before the hit', () => {
    const d = lastExactAspectDate('Sun', 'opposition', 'Moon', ref)!;
    const [again] = nextExactAspectDates('Sun', 'opposition', 'Moon', new Date(d.getTime() - 3_600_000), 2, 1);
    expect(Math.abs(again.getTime() - d.getTime())).toBeLessThan(60_000);
  });
});

describe('aspectStrengthTimeline', () => {
  const from2026 = new Date(Date.UTC(2026, 0, 1));
  const [fullMoon] = nextExactAspectDates('Sun', 'opposition', 'Moon', from2026, 40, 1);

  it('peaks at the exact instant (full moon) and is zero at the window edges', () => {
    const tl = aspectStrengthTimeline('Sun', 'opposition', 'Moon', fullMoon);
    expect(tl.points.length).toBe(121);
    expect(tl.from.getTime()).toBeLessThan(fullMoon.getTime());
    expect(tl.to.getTime()).toBeGreaterThan(fullMoon.getTime());
    // Padded 40% past the orb window, so both ends must be out of orb.
    expect(tl.points[0].strength).toBe(0);
    expect(tl.points[tl.points.length - 1].strength).toBe(0);
    // The strongest sample sits within a few sample steps of the exact
    // instant. Not exactly one: the applying flag (one-hour lookahead, the
    // matchPair convention) flips to separating just before the crossing,
    // so its 0.9 factor can shift the peak a sample or two early.
    const stepMs = (tl.to.getTime() - tl.from.getTime()) / (tl.points.length - 1);
    const peak = tl.points.reduce((x, y) => (y.strength > x.strength ? y : x));
    expect(peak.strength).toBeGreaterThan(0);
    expect(Math.abs(peak.t.getTime() - fullMoon.getTime())).toBeLessThanOrEqual(3 * stepMs);
  });

  it('scales the window to the pair: Moon aspects span days, slow pairs span months or more', () => {
    const moonTl = aspectStrengthTimeline('Sun', 'opposition', 'Moon', fullMoon);
    const moonSpanDays = (moonTl.to.getTime() - moonTl.from.getTime()) / 86_400_000;
    expect(moonSpanDays).toBeLessThan(10); // Moon separates from the Sun ~12 deg/day
    const [slowExact] = nextExactAspectDates('Jupiter', 'square', 'Saturn', from2026, 3650, 1);
    if (slowExact) {
      const slowTl = aspectStrengthTimeline('Jupiter', 'square', 'Saturn', slowExact);
      const slowSpanDays = (slowTl.to.getTime() - slowTl.from.getTime()) / 86_400_000;
      expect(slowSpanDays).toBeGreaterThan(moonSpanDays);
    }
  });

  it('is deterministic', () => {
    const a = aspectStrengthTimeline('Venus', 'trine', 'Mars', fullMoon, 31);
    const b = aspectStrengthTimeline('Venus', 'trine', 'Mars', fullMoon, 31);
    expect(a).toEqual(b);
  });
});
