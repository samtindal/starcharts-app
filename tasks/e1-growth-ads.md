# E1 | Growth & Ads

**Scope:** Monetization + share loops. Depends on C1 (events) and D1 (pages).
**Read first:** `docs/ad-monetization-review.md` (ranks every item below by dollar impact). This brief is the build spec; the review is the reasoning.

Ad revenue = sessions × pages/session × viewability × RPM. Each item notes which input it moves.

## Ad network | a staircase, not AdSense forever (RPM)

Build the ad layer **network-agnostic**: one `<AdSlot>` component with a provider adapter, so swapping the tag is a config change, not a refactor. Component contract: `docs/adslot-component-spec.md` (API, provider adapter, slot registry, consent gating, CLS guards). AdSense is the launch seed, not the plan; header-bidding managers pay ~2–4x for the same impressions.

| Stage | Threshold | Network | Note |
|---|---|---|---|
| Launch | 0 → ~10k sessions/mo | AdSense | Season domain, pass policy, clean ads.txt |
| Growth | ~10k+ sessions/mo | Ezoic | No hard minimum; auto placement/density; higher RPM |
| Scale | 50k sessions/mo | Mediavine | Premium demand, strong in the female-skew lifestyle vertical |
| Scale | 100k pageviews/mo | Raptive | Top-tier RPM; pick vs Mediavine on measured RPM |

Each threshold is a named milestone with a switch-over checklist: update ads.txt, re-verify CMP compatibility, re-test Core Web Vitals after the new tag lands.

## Slot map (viewability + units)

- **Aspect/sign/planet pages** (where search traffic lands): one in-article unit after the opening meaning section; one at the bottom before footer links. Add a **third in-content unit only after the page is deepened** (see D1/§4 of the review) so the content-to-ad ratio stays clean. Desktop: **sticky sidebar unit**.
- **Clock page**: one unit below the aspect table, **plus a desktop sticky sidebar that never overlaps or sits adjacent to the wheel.** The 10-min sessions here are the most under-monetized inventory; the sidebar captures the dwell the single below-table unit misses. **Nothing on or adjacent to the wheel** (accidental-click policy; the clean wheel is the share screenshot).
- **sky-today page**: treat as premium recurring-visit inventory (see below).
- **Mobile anchor**: one of the highest-RPM units in display, **test at launch on content pages** with real RPM data rather than deferring on brand grounds. Keep off the wheel.
- **Ad refresh on active engagement**: on the clock, in-policy refresh gated on interaction + viewability is a legitimate 20–40% lift given the dwell. Implement carefully within network/AdSense policy.
- **Lazy-load** below-fold units for fresh on-scroll impressions.
- Every slot gets a **fixed-height reserved container**, layout shift (CLS) from late-loading ads damages Core Web Vitals → rankings → the traffic the ads feed on.
- **EU consent (CMP)** loads before any ad script; no personalized ads without consent. A Google-certified CMP with an optimized prompt raises EU RPM via opt-in; treat consent UX as a revenue A/B test.

## Session depth (pages/session)

- **Internal linking rail** on every content page: reverse pair, the other four aspects for the same planet pair, "aspects active today"/live clock, the signs both planets currently occupy, 2–3 related pairs. (Content-page → content-page links only; the clock's aspect-table rows still link only to aspect pages per CLAUDE.md.)
- **Embed the live mini-wheel on every content page**, pre-scrubbed to the relevant chart/next-exact date. Highest-value dwell feature and AI-Overview-proof; turns an informational bounce into an interactive session.

## sky-today surface (return sessions)

Build the "sky right now / this week / what's retrograde" page early (competitive-strategy Bet 4). Daily-updating, embeddable, PWA daily-return habit. Wire the PWA install prompt and the morning email loop to it. Recurring visits are the best inventory and hedge the search-dependency risk.

## Beyond display (revenue/visitor + Google-risk hedge)

- **Affiliate module**: contextual "recommended reading" (books/apps) on planet + aspect pages; "full written report" affiliate. Labeled, relevant, not spammy.
- **Email capture**: "the sky in your inbox each morning," captured on sky-today and after natal/synastry results, never an interstitial over the wheel.
- **MCP referral → ad pages**: the canonical URL the free MCP tools return is an ad-carrying content page, pre-scrubbed, so AI citations become ad-page referrals.

## Share loops

- OG image endpoint: chart-svg rendered server-side → PNG for any chart URL. Natal/synastry results get "share my chart" buttons.

## Analytics | instrument for yield, not just engagement

- Product events (privacy-light, e.g. Plausible + GA4): drag engagement, date-travel depth, aspect taps, share clicks, MCP referrals, PWA installs.
- **Revenue events / dashboard**: RPM by page template (clock vs aspect vs sign vs planet vs sky-today), RPM & session value by geo (bias SEO/language to tier-1: US/UK/CA/AU RPMs ~10x tier-3), RPM by traffic source, pages/session, scroll depth, ad viewability, CMP consent rate.
- PWA install prompt after 2nd session.

## Build order

1. Network-agnostic ad layer + AdSense launch + migration milestones.
2. Internal-link rail + embedded wheel on content pages.
3. sky-today surface + PWA return loop + email capture.
4. Deepen meaning pages (with D1), then add the earned 3rd unit.
5. Slot-map revision: clock sticky sidebar, mobile anchor test, engagement-gated refresh.
6. Affiliate module + MCP-referral routing.
7. Yield dashboard (RPM by template/geo/source, consent rate).
