# Starcharts | AdSlot Component Spec

**Owner:** E1 (Growth & Ads). **Status:** spec, not yet built. **Build brief:** `tasks/e1-growth-ads.md`. **Ranked rationale:** `docs/ad-monetization-review.md`.

This is the implementation contract for the single ad primitive used across the site. The goal from E1: build the ad layer network-agnostic so swapping the provider (AdSense to Ezoic to Mediavine to Raptive) is a config change, not a refactor. Everything that renders an ad goes through `<AdSlot>`. No page calls a network tag directly.

## 1. Non-negotiable constraints (owner rules)

These come from `CLAUDE.md` and `tasks/e1-growth-ads.md`; the component must enforce them, not just permit them.

- **Nothing on or adjacent to the wheel.** The clean wheel is the share screenshot and the accidental-click surface. `<AdSlot>` must never be a child of, or a direct layout neighbor of, the `Wheel` component. Enforced by slot registry (no wheel-adjacent slot exists) plus a dev-time guard (see §9).
- **Zero layout shift.** Every slot reserves its final height before the tag loads. CLS from late ads damages Core Web Vitals, which damages rankings, which is the traffic the ads feed on. A slot with no reserved height is a build error.
- **Consent before ad script.** No ad provider script loads, and no personalized ad requests fire, until the CMP has resolved consent. Non-personalized (contextual) serving only when consent is denied, where the provider supports it.
- **No hardcoded colors.** The reserved container, label, and placeholder use only the CSS custom properties from `PLAN.md` §5 / `globals.css` (`--line-faint`, `--parchment`, etc.). No hex literals in the component.
- **No em dashes** in any copy the component renders (labels, a11y text).

## 2. Component API

Client component (`'use client'`), because it observes viewport, consent, and interaction.

```tsx
// apps/web/components/ads/AdSlot.tsx
export type SlotName =
  | 'content-in-article'      // after opening meaning section
  | 'content-footer'          // above footer links
  | 'content-in-content-3'    // earned 3rd unit, gated on deepened page (D5)
  | 'content-sidebar'         // desktop sticky sidebar
  | 'clock-below-table'       // below the aspect table
  | 'clock-sidebar'           // desktop sticky, never wheel-adjacent
  | 'sky-below-fold'          // sky-today recurring inventory
  | 'mobile-anchor';          // sticky bottom, mobile only, content pages

export interface AdSlotProps {
  slot: SlotName;
  /** Template the slot renders on; drives targeting + which registry entry applies. */
  template: 'aspect' | 'sign' | 'planet' | 'planet-in-sign' | 'clock' | 'sky';
  /** Below-fold slots lazy-load; above-fold slots render eagerly. Defaults from registry. */
  lazy?: boolean;
  /** Opt into in-policy refresh (clock only). Defaults from registry; ignored elsewhere. */
  refresh?: boolean;
  className?: string;
}
```

Callers never pass sizes, network IDs, or ad-unit paths. Those live in the registry (§4) and the provider adapter (§3), so a page is only ever declaring intent: "a content-in-article slot on an aspect page."

## 3. Provider adapter (network-agnostic seam)

One interface, one active implementation selected by env. Adding a network = adding an adapter file, no page or `AdSlot` change.

```ts
// apps/web/lib/ads/provider.ts
export interface AdProvider {
  name: 'adsense' | 'ezoic' | 'mediavine' | 'raptive' | 'none';
  /** Loaded once, after consent resolves. Idempotent. */
  loadScript(consent: ConsentState): Promise<void>;
  /** Fill a reserved container that is already in the DOM at its final height. */
  mount(el: HTMLElement, slot: ResolvedSlot, consent: ConsentState): void;
  /** In-policy refresh of an already-mounted slot. No-op if the provider forbids it. */
  refresh?(el: HTMLElement, slot: ResolvedSlot): void;
  unmount(el: HTMLElement): void;
}

export const activeProvider: AdProvider =
  PROVIDERS[process.env.NEXT_PUBLIC_AD_PROVIDER ?? 'none'];
```

`'none'` is the default and renders a themed placeholder box at the correct reserved height, so layout is identical in dev, in preview, and in markets where ads are off. Launch sets `adsense`; the migration milestones in E1 flip the env var and run the switch-over checklist (ads.txt, CMP re-verify, Core Web Vitals re-test).

## 4. Slot registry (single source of sizes and behavior)

```ts
// apps/web/lib/ads/registry.ts
export interface ResolvedSlot {
  name: SlotName;
  reserved: { mobile: [w: number, h: number]; desktop: [w: number, h: number] };
  lazyDefault: boolean;
  refreshDefault: boolean;      // true only for clock slots
  desktopOnly?: boolean;        // sidebars
  mobileOnly?: boolean;         // mobile-anchor
  networkUnit: Record<AdProvider['name'], string>;  // per-provider unit id/path
}
```

The registry is the one place sizes are defined, so the reserved-height guarantee (§1) is structural: `AdSlot` reads `reserved` and sets the container box before mount. Placement per template mirrors the E1 slot map:

| Template | Slots |
|---|---|
| aspect / sign / planet / planet-in-sign | `content-in-article`, `content-footer`, `content-sidebar` (desktop), `mobile-anchor` (mobile). `content-in-content-3` only once the page is deepened (D5). |
| clock | `clock-below-table`, `clock-sidebar` (desktop). Refresh eligible. Never wheel-adjacent. |
| sky | `sky-below-fold`, plus the content slots as sky-today matures. Treated as premium recurring inventory. |

## 5. Reserved container and render shape

```tsx
<aside
  className={`adslot adslot--${slot} ${className ?? ''}`}
  style={{ minHeight: reservedHeight, minWidth: reservedWidth }}
  aria-label="Advertisement"
  data-template={template}
>
  <span className="adslot__label">Advertisement</span>
  <div ref={mountRef} className="adslot__mount" />
</aside>
```

- `minHeight` / `minWidth` come from the registry per breakpoint, applied before any script runs, so the box never grows on fill (zero CLS).
- The `Advertisement` label is required for policy and a11y; styled with `--parchment` at low opacity, boxed with `--line-faint`. No hex.
- `aria-label` present so screen readers announce and can skip the region.

Styles live in `globals.css` under `.adslot*`, using tokens only:

```css
.adslot { display: flex; flex-direction: column; align-items: center; }
.adslot__label { color: var(--parchment); opacity: .5; font-size: .7rem; letter-spacing: .08em; }
.adslot__mount { border: 1px solid var(--line-faint); }
```

## 6. Lazy-load

Below-fold slots (`lazyDefault: true`) mount via `IntersectionObserver` at a rootMargin that fetches slightly before entry, so the impression is fresh-on-scroll but not late. Above-fold slots (`content-in-article` near the top, both sidebars once sticky) render eagerly after consent. The reserved box exists from first paint either way, so lazy-load never causes shift.

## 7. Consent (CMP) gating

```ts
// apps/web/lib/ads/consent.ts  (thin wrapper over the Google-certified CMP / TCF API)
export type ConsentState = { ready: boolean; personalized: boolean };
export function onConsent(cb: (c: ConsentState) => void): () => void;
```

`AdSlot` subscribes on mount and does nothing until `ready`. On resolve it calls `activeProvider.loadScript(consent)` once (guarded, idempotent), then `mount`. If `personalized` is false, the adapter requests contextual-only. The CMP script itself is the only ad-related thing allowed to load pre-consent. Per E1, consent UX is a revenue A/B test surface, so the wrapper exposes the consent event for analytics.

## 8. Engagement-gated refresh (clock only)

The clock's long dwell (astro-seek's 10-minute benchmark) makes in-policy refresh a real 20-40% lift. Rules the component enforces:

- Only `clock-below-table` and `clock-sidebar` are refresh-eligible (`refreshDefault: true`); `refresh` is ignored on every other slot.
- Refresh fires only when the slot is in-viewport (viewability gate) AND a user interaction has occurred since the last fill (drag, date jump, aspect tap), AND the minimum interval the network allows has elapsed.
- Interaction signal comes from the existing C1 analytics events, not a new listener.
- If `activeProvider.refresh` is undefined (network forbids it), the flag is a silent no-op.

## 9. Guards and tests

- **Wheel-adjacency guard (dev only):** on mount, if an ancestor or immediate sibling carries `data-wheel`, throw in development. Ships as a no-op in production but fails loudly in review, encoding the owner rule as code.
- **Reserved-height test:** every registry entry has non-zero `reserved` for both breakpoints; unit test asserts it.
- **CLS test:** Lighthouse/Playwright asserts cumulative layout shift contribution from ad containers is 0 on aspect and clock templates (feeds the E2 Lighthouse ≥90 gate).
- **Consent-order test:** assert no provider script tag appears in the DOM before the CMP resolves.
- **Provider-swap test:** rendering with `NEXT_PUBLIC_AD_PROVIDER=none` produces reserved placeholders and no network requests; the app is fully functional with ads off.

## 10. File layout

```
apps/web/
  components/ads/AdSlot.tsx        client primitive
  lib/ads/registry.ts             slot sizes + per-network unit ids
  lib/ads/provider.ts             AdProvider interface + active selection
  lib/ads/providers/adsense.ts    launch adapter
  lib/ads/providers/none.ts       default placeholder adapter
  lib/ads/consent.ts              CMP/TCF wrapper
```

## 11. Acceptance criteria

1. A page adds a unit with `<AdSlot slot="content-in-article" template="aspect" />` and nothing else.
2. Switching networks is one env var plus one adapter file; no page or `AdSlot` edit.
3. Zero measured CLS from any slot on any template.
4. No ad or provider script loads before consent resolves; contextual-only when consent is denied.
5. No slot renders on or adjacent to the wheel (guard passes; registry has no such slot).
6. Every rendered surface uses theme tokens only; no hex in the component or its styles.
7. Clock refresh fires only under the interaction + viewability + interval gate, and is a no-op where the network forbids it.
