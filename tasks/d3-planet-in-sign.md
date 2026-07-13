# D3 | Planet-in-sign content

**Scope:** The biggest casual content family the build is missing: "planet in sign" pages (e.g. `/planets/venus/leo`, "Venus in Leo"). Server-rendered in apps/web, same pattern as sign/planet/aspect pages. Extends D1.

Depends on: B1 (done); B3 optional (Chiron adds one more body if approved). Blocks: nothing. Runs parallel to C3/D4.

**Why:** "my Venus is in Leo", "Mars in Scorpio meaning", "Moon in Cancer" are enormous, evergreen casual queries and the exact thing users screenshot from apps. D1 already lists "planet in sign (144)" as intended but it was never built; this brief specs and builds it. It also becomes the internal-link fabric that ties the planet pages and sign pages together, and the destination for the natal-chart placements C3 surfaces.

## Page set

- **Points × signs.** 10 planets + 2 nodes = 12 points × 12 signs = **144 pages**. (If B3 §4 ships Chiron, 13 × 12 = 156; gate the extra 12 behind the same Chiron flag so they don't 404 or appear before the point does.) Nodes-in-sign are legitimate and low-competition ("North Node in Aries"), keep them.
- **URL:** `/planets/{point}/{sign}` (extends the existing `/planets/{point}` route with a nested `[sign]` segment). Slugs reuse `kebab`/`pointFromSlug`/`signFromSlug` from `lib/content.ts`, do not invent new slug logic.
- **On-demand ISR** like the aspect pages (`revalidate = 86400`, `generateStaticParams` returns `[]`, sitemap lists all 144). Keeps builds fast; the sitemap grows from 358 to ~502 URLs.

## Content model (avoid the mad-libs trap)

The current per-pair aspect teaser is visibly templated ("identity and vitality merges with mind and message") and reads thin, do not repeat that mistake at 144-page scale. Structure each page as **computed spine + composable interpretation**, not one generated sentence:

- **Computed, always true:** where this point sits in this sign in the tropical zodiac, this sign's element/modality/ruler (`SIGN_INFO`), the point's archetype (`ARCHETYPE`), and, the SEO-defensible part, **when this actually happens next**: next dates the point ingresses/occupies this sign, from astro-core (reuse the `nextExactDates` search pattern against sign boundaries). For fast bodies (Moon, Sun, Mercury, Venus, Mars) this is a real recurring calendar; for slow ones it's the current/next multi-year transit window. This is data no prose-only competitor can generate and is AI-Overview-resistant (competitive-strategy Bet 2).
- **Interpretation (fully generated, no hand authoring):** call `composePlanetInSignParagraphs(point, sign)` from astro-core (`interpret.ts`, re-exported via `apps/web/lib/compose.ts`). It emits 3 distinct paragraphs (core key, expression, best/strain) from the point's `Voice` and the sign's element/modality (derived from zodiac position, so nothing is re-derived or can contradict `SIGN_INFO`). All 144 are unique and clean, enforced by `interpret.test.ts`. No per-page essays and no hand-written toppers (owner decision 2026-07-08); if a section reads thin, add phrasings in `interpret.ts`. Tone is knowledgeable and tradition-framed, never predictive-for-payment (ad policy, PLAN.md §7).
- **Embedded live wheel** pre-scrubbed to a date when the point is in that sign (every content page is an interactive artifact, competitive-strategy Bet 2), where a current/near example exists; otherwise a static mini illustration.

## Linking (obey the owner's rules)

- On each planet-in-sign page: first mention of the point links to `/planets/{point}`, first mention of the sign links to `/signs/{sign}`, and relevant current aspects of that point link to their aspect pages, the same "first mention links" content-page rule D1 set. These are CONTENT pages, so planet links are allowed here (the drag-only, no-planet-link rule applies to the CLOCK page only).
- Add reciprocal links: `/planets/{point}` lists its 12 signs; `/signs/{sign}` lists the 12 points in it. This closes the internal-link graph and gives crawlers a path to all 144.
- Breadcrumbs: Planets › Venus › in Leo.

## SEO / technical

Metadata title "Venus in Leo: meaning and dates | Starcharts" (owner uses "|" as title separator, never em dash). Description from the composed opener. Canonical URLs, JSON-LD, OG tags per page (hand OG image to E1). Sitemap + robots updated. Priority order for hand-written depth: personal planets in signs first (highest volume), then outer planets, then nodes.

## Done when

144 (or 156 w/ Chiron) pages render with computed next-in-sign dates + composed non-repetitive copy + embedded/illustrated wheel; reciprocal links from planet and sign hubs resolve; sitemap updated; titles use "|"; no em dashes in copy; no hardcoded colors. Update status line.
