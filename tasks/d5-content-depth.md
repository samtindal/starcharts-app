# D5 | Content depth: deepen the existing aspect, sign & planet pages

**Status: done 2026-07-13.** Aspect pair pages render `composeAspectParagraphs` (opener as lede, then energies/combination/balance/transit-natal), the past-and-next exact-date timeline (`lastExactAspectDate` + `nextExactAspectDates`), a server-rendered aspect strength-over-time SVG (`aspectStrengthTimeline`, new in `events.ts`), and the full internal-link rail (reverse pair, other four aspects, both current signs, 3 related pairs, type hub); non-canonical slug order 301s to the POINTS-ordered slug with a matching canonical tag. `composeAspectTeaser` is the single teaser source for the aspect page, the wheel's aspect table, and the planet page (`pairText`/`PAIR_TEMPLATE` deleted). Sign and planet pages carry new composed paragraphs (`composeSignParagraphs`, `composePlanetParagraphs`), reciprocal planet-in-sign links, and (planets) a traditional dignities table (`DIGNITIES` in `lib/content.ts`). `/moon` gained three explanatory sections. A shared `Crumbs` component adds visible breadcrumbs plus `BreadcrumbList` JSON-LD across aspect, sign, planet, planet-in-sign, sky, and moon pages. Gated by `interpret.test.ts` (extended) and new `timeline.test.ts`; `npx vitest run` and `npm run typecheck` both green. The embedded pre-scrubbed wheel stays deferred to E1 coordination, not built here.

**Scope:** Flesh out the pages D1 already shipped thin: the **325 aspect-pair pages**, **12 sign pages**, **12 planet/point pages**. No new routes, no new engine math, this is a content-quality pass on existing `apps/web` pages, plus the shared composition module D3 also uses. Extends D1 (which is marked done but left its "real copy" TODO unfinished).

Depends on: D1 (done), B1 (done). Shares infra with D3 (same composed-fragment engine). Coordinates with E1 (embedded wheel, ad slots, internal links). Blocks: nothing, but see launch note.

**Why this exists:** the pages that carry search traffic today are thin. The aspect page is a one-line teaser + one templated paragraph (`pairText` from `ARCHETYPE`, visibly mad-libs: "identity and vitality merges with mind and message") + a live-status line + a dates table. Sign and planet pages are a lede + a single `SIGN_INFO`/`PLANET_BLURB` paragraph + a "right now" table. Thin, templated content (a) under-ranks post-Helpful-Content and is the query class AI Overviews eat, so it under-earns on traffic, and (b) supports few ad units and little dwell, so it under-earns per visit. D1 line 8 promised to replace the generated teaser with "the opening line of each pair's real page copy"; that copy was never written. This brief owns it. See `docs/ad-monetization-review.md` §4.

**The one rule (owner, 2026-07-08): no hand-written per-page copy anywhere. All interpretation is generated and must be deep on its own.** There is no hand-written "ceiling" for high-traffic pages; depth comes from the generator composing many independent dimensions. Every page is **computed spine (always true, ephemeris-backed) + fully generated multi-paragraph interpretation**, never a single generated sentence and never an authored essay.

**The engine already exists:** `packages/astro-core/src/interpret.ts` (pure, shared with the MCP server; re-exported from `apps/web/lib/compose.ts`), gated by `packages/astro-core/test/interpret.test.ts`. It emits 5 paragraphs per aspect page (4 for node pairs) and 3 per planet-in-sign, all unique and clean. D5's job is to wire these into the page components and add the computed spine, not to write copy. Deepen by adding phrasings/`Voice` fields to `interpret.ts` if a section reads thin. Standard: `docs/content-quality-bar.md`.

---

## Aspect-pair pages (325) | the priority

Route `apps/web/app/aspects/[slug]/page.tsx`, unchanged URL/ISR. Deepen from ~4 short blocks to a real page:

- **Unique opener (replaces the templated teaser)** from `composeAspectTeaser`. The full body comes from `composeAspectParagraphs`: opener, energies, combination, balance, transit-vs-natal. Every pair reads distinct (enforced by the uniqueness test), so there is no per-pair authoring. The opener also becomes the wheel tooltip / aspect-table teaser (single source, D1's promised unification), preserving the owner rule that the teaser is unique per pair.
- **What it means for these two specifically:** a paragraph composed from the pair's archetypes crossed with the aspect's quality (ease vs friction, inner vs outer), tradition-framed ("in traditional astrology…"), never predictive-for-payment (PLAN.md §7).
- **Transit vs natal read:** one short paragraph on how the aspect reads as a passing transit (what the sky is doing now) vs in a birth chart (a standing feature). This also seeds the natal/synastry funnel (C2/C3).
- **Timeline (computed, the SEO-defensible part):** keep the "next exact" table, now correct for conjunctions/oppositions via `nextExactAspectDates` (astro-core). Add the **most recent past exact** and frame a short past→next window so the page answers "when did/does this happen" precisely, the query family competitors keep stale. Read orb text from `orbFor` once B3 §2 lands (no hardcoded orb numbers).
- **SVG Aspect Strength Graph:** Render a responsive, server-side SVG graph showing the aspect's strength over the transit window (buildup to exactness/peak and fading out). Compute the data points using `getAspectStrengthTimeline` in astro-core.
- **Embedded live wheel** pre-scrubbed to the next exact date of this pair (every content page is an interactive artifact; hand the OG snapshot to E1). This is the dwell-time and AI-Overview-resistant piece.
- **Internal-link rail (fixes the current dead end):** reverse pair (Mars square Venus ↔ Venus square Mars), the other four aspects between the same two points, the two signs each point currently occupies, 2–3 related pairs, and the aspect-type hub. Content-page to content-page only; the clock's aspect-table-row rule (aspect pages only) is unchanged.

## Sign pages (12)

Route `apps/web/app/signs/[sign]/page.tsx`. Keep the live "in {sign} right now" table (good freshness). Add depth from real attributes, not filler:

- Expanded element/modality/polarity/season/ruler paragraph, with the **ruler linked** to its planet page and a one-line "why that rulership" note.
- The sign's traditional associations (body, keywords from `SIGN_INFO`, the season it opens) composed into two short paragraphs, tradition-framed.
- **Reciprocal links to the 12 planet-in-sign pages for this sign** ("the planets in {sign}: Sun in {sign}, Moon in {sign}…") once D3 ships, closing the internal-link graph with D3.

## Planet/point pages (12)

Route `apps/web/app/planets/[planet]/page.tsx`. Keep the live position + current-aspects table. Add:

- Expanded archetype paragraph beyond the one-line `PLANET_BLURB`: speed/cycle (how long per sign), retrograde behavior and cadence, what dragging it on the clock does at that rate (ties to the toy).
- Traditional **dignities**: the sign(s) it rules and is exalted in, linked to those sign pages (composed from a small dignity table, add to `lib/content.ts`).
- **Reciprocal links to the 12 planet-in-sign pages for this point** ("{Planet} through the signs") once D3 ships.
- Nodes and (if B3 §4 lands) Chiron get honest, shorter treatments; do not invent dignities the tradition doesn't assign to points.

## Shared with D3 (build once)

The generator (`interpret.ts`) is already built in astro-core and used by both D5 and D3; neither forks it. To widen variety or depth, add phrasings to `OPENERS`/`ENERGIES`/`COMBINATION`/`BALANCE`/`TRANSIT_NATAL` or enrich a `Voice`; `pick()` picks them up and `interpret.test.ts` keeps quality from regressing. The phrasings are vetted clause banks, not per-page essays.

## Rules (CLAUDE.md)

No em dashes in copy (commas/colons/periods; en dashes only in numeric ranges). Titles use "|" separator. No hardcoded colors. No hardcoded orb numbers (read `orbFor`/`ASPECT_TYPES`). Single source of truth: never reimplement angle/aspect/position math in the page; import from astro-core. Tradition-framed tone, no fate-for-payment claims (§7).

## Priority order

1. Aspect pages, personal-planet pairs first (Sun/Moon/Mercury/Venus/Mars combinations), highest traffic.
2. Aspect pages, outer-planet and node pairs.
3. Sign pages, then planet pages (they are hubs; depth matters but volume is 24, quick).

## Launch note

Per `docs/ad-monetization-review.md` and the launch phasing: at minimum the **aspect-page opener rewrite (kills the visible mad-libs) + the internal-link rail** should land before launch, because these are the ad-carrying pages and thin templated copy hurts both ranking and RPM. Full per-pair depth for all 325 can trail as a fast-follow, ordered by the priority list, since the composed model makes it incremental rather than 325 essays.

## Done when

Aspect pages render a unique composed opener (no visible templating), a pair-specific meaning section, a transit-vs-natal note, a past→next computed timeline, an aspect strength-over-time SVG graph, an embedded wheel, and the full internal-link rail; the opener is the single source for the wheel teaser; sign and planet pages carry expanded attribute-based copy and reciprocal planet-in-sign links; the composed-fragment engine is shared with D3; no em dashes, no hardcoded colors or orbs, tradition-framed. Update this brief's status line and D1's note that the real-copy TODO is now owned here.
