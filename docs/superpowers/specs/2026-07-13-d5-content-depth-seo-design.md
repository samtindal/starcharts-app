# D5 Content Depth + SEO Linking Pass | Design

**Date:** 2026-07-13 · **Executes:** `tasks/d5-content-depth.md` (all but the embedded pre-scrubbed wheel, which stays with E1) plus the SEO-review fixes from this session.
**Owner decisions honoured:** no hand-written per-page copy (generated clause banks only), no em dashes, palette tokens only, no hardcoded orb numbers, teaser unique per pair, tradition-framed.

## 1. Aspect pair pages (325), `apps/web/app/aspects/[slug]/page.tsx`

- Body from `composeAspectParagraphs` (astro-core, already built and tested): opener becomes the lede, remaining paragraphs the body. `MEANING_LONG` leaves the pair pages (stays on type hubs).
- Metadata description from `composeAspectTeaser`; title unchanged.
- Non-canonical slug order (e.g. `venus-trine-sun`) issues `permanentRedirect()` to the POINTS-ordered slug; canonical URL declared in metadata.
- Timeline: keep next-4 exact dates; add most recent past exact via new `lastExactAspectDate` (astro-core), degrading gracefully when none in scan window.
- Strength-over-time SVG graph (see §5) under the timeline, drawn for the nearest exact date.
- Internal-link rail: breadcrumbs (Aspects > type > pair), the other four aspects of the same pair, each point's current sign linked via its planet-in-sign page, 3 related same-type pairs sharing one endpoint (deterministic rotation, canonical order, node-node excluded), type hub.

## 2. Teaser unification

`Wheel.tsx` aspect-table teaser and the planet page's teaser line switch from `pairText` to `composeAspectTeaser`. `pairText`/`PAIR_TEMPLATE` are deleted from `lib/content.ts`. Client-bundle cost of interpret.ts is ~10 KB of pure strings.

## 3. Hubs

- `/aspects`: each pair row carries five links (glyph + type name anchors), one per aspect type.
- Each type hub (`/aspects/trine` etc.): full list of its 65 pair pages with full-text anchors ("Sun trine Moon").
- Result: every pair page has at least 2 stable inlinks with descriptive anchor text.

## 4. Sign, planet, planet-in-sign, moon pages

- New `composeSignParagraphs(sign)` in astro-core interpret.ts: element/modality/polarity paragraph, season/body/rulership-why paragraph, gift/shadow paragraph. Backed by a per-sign tradition table (clause bank, 12 entries). Ruler display name derives from `VOICES` so it can never disagree with the planet pages.
- New `composePlanetParagraphs(point)` in astro-core interpret.ts: expanded archetype from `Voice` fields, pace/retrograde-cadence paragraph from a per-point cycle table, gift/shadow paragraph. Nodes get the honest short treatment.
- `lib/content.ts` gains `TRADITIONAL_RULER: Record<SignName, PointName>` (replaces the free-text `SIGN_INFO.ruler`, which is derived for display) and a traditional `DIGNITIES` table (rulerships + exaltations; outers marked modern; nodes none). Sign pages link their ruler; planet pages link their dignity signs.
- `/moon` gains query-shaped sections (phase walk-through, "how long does a void-of-course Moon last", tradition framing), matching D4's prose style on that single explainer page.

## 5. Aspect strength timeline (astro-core `events.ts` + web component)

- `aspectStrengthTimeline(a, type, b, exact, samples ~ 121)`: window half-width = `orbFor / |relative speed at exact|`, padded 1.4x, clamped to [0.5 day, 5 years]; per-sample strength = 0 out of orb, else `aspectStrength(..., 'transit')` with applying computed from instantaneous speeds. Pure, deterministic.
- `lastExactAspectDate(a, type, b, before)`: escalating back-scans (60/400/1100 days) reusing `nextExactAspectDates`; null when nothing found.
- `components/AspectStrengthGraph.tsx`: server component, responsive inline SVG (viewBox, no client JS), area + line coloured by the aspect's `harmony` (soft -> `--soft`, hard -> `--hard`, conjunction -> the wheel's conjunction token), exact-date tick, "now" marker when in window. Rendered inside the existing daily ISR cycle: ~240 ephemeris calls per page per day, no per-visitor cost.

## 6. Breadcrumbs + structured data

Shared `components/Crumbs.tsx` server component: visible trail + `BreadcrumbList` JSON-LD (absolute URLs). Applied to aspect pair/type, sign, planet, planet-in-sign, sky, and moon pages, replacing inline crumbs.

## 7. Testing and verification

- interpret.test.ts additions mirroring the existing gate: 12 sign and 12 planet texts unique, paragraph minimums, no em dash/double space, terminal periods, determinism.
- events tests: timeline peaks at the exact instant (Sun opposition Moon at a full moon), zero at window edges, `lastExactAspectDate` within one lunar month for Sun-Moon.
- `npx vitest run` in astro-core; `npm run typecheck` across workspaces; em-dash grep over changed files. `next build` cannot run in this sandbox (arm64/SWC), typecheck is the gate.

## 8. Docs

Status updates: `tasks/README.md`, `tasks/d5-content-depth.md` status line, `tasks/d1-content-seo.md` real-copy note. Sitemap unchanged (no fake lastModified).

## Out of scope

Embedded pre-scrubbed wheel on aspect pages (E1 coordination), OG images, ad slots, `getAspectStrengthTimeline` for any surface other than the aspect pages.
