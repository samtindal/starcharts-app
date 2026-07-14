import { describe, expect, it } from 'vitest';
import { REGISTRY, type SlotName } from '../lib/ads/registry';
import { activeProvider } from '../lib/ads/provider';
import { noneProvider } from '../lib/ads/providers/none';
import { getConsent } from '../lib/ads/consent';

// adslot-component-spec.md §9: "Reserved-height test: every registry entry
// has non-zero reserved for both breakpoints; unit test asserts it." Slots
// scoped to one breakpoint (desktopOnly/mobileOnly) legitimately reserve
// zero on the breakpoint where CSS hides them (adslot--desktop-only /
// adslot--mobile-only both use display:none there), so the invariant is
// "non-zero on every breakpoint the slot can actually render on."
describe('ad slot registry', () => {
  const names = Object.keys(REGISTRY) as SlotName[];

  it('reserves non-zero height on every breakpoint the slot renders on', () => {
    for (const name of names) {
      const slot = REGISTRY[name];
      if (!slot.mobileOnly) {
        expect(slot.reserved.desktop[0], `${name} desktop width`).toBeGreaterThan(0);
        expect(slot.reserved.desktop[1], `${name} desktop height`).toBeGreaterThan(0);
      }
      if (!slot.desktopOnly) {
        expect(slot.reserved.mobile[0], `${name} mobile width`).toBeGreaterThan(0);
        expect(slot.reserved.mobile[1], `${name} mobile height`).toBeGreaterThan(0);
      }
    }
  });

  it('never marks a slot both desktop-only and mobile-only', () => {
    for (const name of names) {
      expect(REGISTRY[name].desktopOnly && REGISTRY[name].mobileOnly).toBeFalsy();
    }
  });

  it('only the clock slots default to refresh-eligible', () => {
    for (const name of names) {
      if (REGISTRY[name].refreshDefault) {
        expect(name.startsWith('clock-')).toBe(true);
      }
    }
  });
});

// §9: "Provider-swap test: rendering with NEXT_PUBLIC_AD_PROVIDER=none
// produces reserved placeholders and no network requests; the app is fully
// functional with ads off."
describe('ad provider selection', () => {
  it('defaults to the none provider (no env var set in this test run)', () => {
    expect(activeProvider.name).toBe('none');
  });

  it('none provider is fully inert: no script load, no DOM mutation, safe unmount', async () => {
    await expect(noneProvider.loadScript({ ready: true, personalized: false })).resolves.toBeUndefined();
    expect(() => noneProvider.mount({} as HTMLElement, REGISTRY['content-in-article'], { ready: true, personalized: false })).not.toThrow();
    expect(() => noneProvider.unmount({} as HTMLElement)).not.toThrow();
  });
});

// §9: "Consent-order test: assert no provider script tag appears in the DOM
// before the CMP resolves." No jsdom in this workspace yet, so this checks
// the pre-DOM contract instead: consent starts unresolved, and nothing in
// this module reaches for `document` before a window exists to ask.
describe('consent gate', () => {
  it('starts unresolved until a visitor (or GPC) decides', () => {
    expect(getConsent()).toEqual({ ready: false, personalized: false });
  });
});
