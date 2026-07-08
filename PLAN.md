# Starcharts — Multi-Agent Build Plan

An interactive astrology clock: the chart wheel for *today*, planets you can **drag** to travel through time, aspect lines drawn live. Old-nautical theme (dark navy, gray linework, gold accents). Goal: mass engagement → ad revenue, plus an MCP server as a paid API surface.

---

## 1. Product Summary

**Core loop (the hook):** The wheel shows current planetary positions. Grab any planet and drag it around the zodiac — the *date changes* to match (drag the Moon for hours/days, drag Saturn for years, drag Pluto for centuries). Aspect lines (conjunction, sextile, square, trine, opposition) appear/dissolve as you scrub. This is a time machine disguised as a clock.

**Positioning (decided): the casual astrology consumer.** Deep astrological tooling (houses, house systems, exotic points, Vedic) already exists — astro-seek on the web, several tool-heavy MCP servers. Starcharts does NOT compete on depth. It competes on being the most delightful, legible way to see the sky and understand aspects. Every feature decision filters through "would someone with casual interest get it in 5 seconds?" Depth features stay deferred (P3) unless casual traction proves demand for them.

**Features by tier:**

| Tier | Feature |
|---|---|
| P0 | Live clock for now; draggable planets ↔ date; aspect lines with orbs |
| P0 | Aspect explanations (tap a line → meaning) |
| P1 | Date input → chart for any date |
| P1 | Birthdate input → natal overlay + transit-to-natal aspects |
| P3 — deferred | Numbered houses + house systems (Whole Sign, Equal, Placidus). **On hold: less is more** — the v1 wheel stays house-free to keep the clock legible. The plan when we do build it: birth location input (lat/lon or place search), Ascendant/MC from sidereal time (astronomy-engine `SiderealTime`), Placidus via iterative semi-arc with Whole Sign fallback above the polar circle, house ring rendered only in natal mode, house pages `/houses/1`–`/houses/12` with tooltips + clickthrough matching the sign/aspect pattern, all math in astro-core, optional `lat`/`lon`/`houseSystem` params on MCP natal tools |
| P2 | Second birthdate → synastry (two natal charts + inter-aspects) |
| P2 | Shareable chart URLs + OG images ("my chart" virality) |

---

## 2. Architecture

- **Framework:** Next.js (App Router). Interactive wheel is a client component; explanation/SEO pages are server-rendered. PWA via manifest + service worker — one codebase for web and mobile.
- **Ephemeris:** [`astronomy-engine`](https://www.npmjs.com/package/astronomy-engine) (MIT, ~100 KB, no data files, runs client-side). Accuracy ≈1 arcminute — far tighter than any aspect orb (degrees). **Do not use Swiss Ephemeris**: it's AGPL or paid commercial license, poison for an ad-monetized closed site.
- **Rendering:** Hand-built SVG (not a chart library). Layers: zodiac ring → degree ticks → house lines (natal mode) → aspect lines → planet glyphs. SVG scales crisply, animates via CSS/spring, and doubles as the OG-image renderer server-side.
- **State:** Single source of truth = a UTC timestamp. Everything (positions, aspects, URL) derives from it. Drag interaction *writes* the timestamp via the inverse solver (§4, Agent C2).
- **MCP server:** Separate lightweight service (Node, streamable-HTTP transport) sharing the same core calc package. Deployed alongside the site.
- **Hosting:** GCP. Both apps run as Cloud Run containers (scale-to-zero ≈ $0 pre-launch, autoscales with ad traffic); Cloud CDN in front of the SEO pages once live (TTFB → Core Web Vitals → rankings); Cloud Armor for MCP free-tier rate limiting. Infra is Terraform (`infra/`), deploys via GitHub Actions + Workload Identity Federation.
- **Monorepo:**

```
packages/astro-core     # pure TS: positions, signs, aspects, natal, synastry — zero DOM deps
packages/chart-svg      # SVG renderer, theme tokens, glyphs
apps/web                # Next.js site + PWA
apps/mcp                # MCP server (imports astro-core)
```

`astro-core` being pure and shared is the keystone: web, MCP, and OG-image generation all call the same functions, so they never disagree.

---

## 3. Agent Roster & Dependency Graph

Each agent gets a task file (`tasks/<id>.md`) with scope, acceptance criteria, and interfaces. Agents work in parallel where the graph allows.

| ID | Agent | Deliverable | Depends on |
|---|---|---|---|
| A1 | **Architect** | Monorepo scaffold, shared TS types (`ChartState`, `Aspect`, `Planet`), CI, CLAUDE.md conventions | — |
| B1 | **Ephemeris Core** | `astro-core`: ecliptic longitudes for Sun–Pluto + Moon at any UTC instant; sign/degree mapping; retrograde flags; aspect detection with per-aspect orbs; unit tests vs published ephemeris tables | A1 |
| B2 | **Chart Renderer** | `chart-svg`: static wheel from a `ChartState` — zodiac ring, glyphs, aspect lines, nautical theme tokens (§5). Storybook-style fixture page | A1 |
| C1 | **Interaction: drag ↔ time** | Pointer-event drag on planet glyphs; **inverse solver** (§4); momentum/snap; Moon-drag fine control; keyboard a11y (arrows step time) | B1, B2 |
| C2 | **Date & natal input** | Date picker → chart; birthdate form → natal overlay (outer ring) + transit-to-natal aspect list; synastry mode (second birthdate, inter-aspect grid) | B1, B2 |
| D1 | **Content & SEO** | Aspect explanation copy (each aspect × planet pair = a page: programmatic SEO, thousands of indexable pages, e.g. "Mars square Venus"); daily "sky today" page; sitemap; metadata | B1 |
| D2 | **MCP Server** | `apps/mcp`: tools `get_current_chart`, `get_chart(date)`, `get_aspects(date)`, `get_natal_chart(birth)`, `get_transits(birth, date)`, `get_synastry(a, b)`; API-key auth + rate limits; free/paid tiers (§6) | B1 |
| E1 | **Growth & Ads** | AdSense/GAM slots (non-intrusive: below fold + explanation pages, never on the wheel); analytics events (drags, date jumps, shares); OG-image endpoint; share URLs encoding chart state | C1, D1 |
| E2 | **QA & Performance** | Position accuracy audit vs astro.com output; drag solver correctness under retrograde; Lighthouse ≥90 mobile; cross-browser pointer events; PWA install flow | C1, C2, D2 |
| F1 | **Infra (GCP)** | Terraform in `infra/` (Cloud Run ×2 scale-to-zero, Artifact Registry, Workload Identity Federation — no SA keys); GitHub Actions CI/CD with smoke tests; later: LB + Cloud CDN for SEO pages, Cloud Armor rate limits for MCP free tier | A1 |
| R1 | **Market Research** | Competitive landscape (`docs/competitive-strategy.md`): incumbents, feature/SEO gaps, positioning, refresh quarterly. Runs parallel to build agents; feeds D1 (content targets) and E1 (growth loops) | — |

**Orchestration rules:** one agent = one session (worktree isolation when touching shared files). Rows execute in dependency order — A → {B1,B2} parallel → {C1,C2,D1,D2} parallel → {E1,E2}; R1 anytime. Research/strategy agents (R-row) never edit code; build agents never edit `docs/strategy`. Every build agent ends by running `npm test` and updating its brief's status line; E2 re-verifies everything before launch. Cross-agent contracts (types, interfaces, theme tokens) change only via PLAN.md edits, so agents can't silently diverge.

**Parallelism:** after A1 → {B1, B2} run in parallel → {C1, C2, D1, D2} largely parallel → {E1, E2}. No cycles.

**Suggested execution:** A1 as one session; B1+B2 as two parallel worktree agents; then C-row; D-row anytime after B1; E-row last. Every agent's acceptance criteria include tests the E2 agent re-runs.

---

## 4. The Hard Problem: Drag → Date (inverse ephemeris)

Forward is easy (date → longitudes). Dragging inverts it: *given planet P at longitude λ, what date?* Non-trivial because:

- **Non-unique:** every planet returns to λ each orbit; Mercury/Venus/Mars cross λ up to 3× near retrograde loops.
- **Solution:** search *nearest in time* to the current chart date. Bisection/secant on `longitude(P, t) − λ` within a window scaled to P's synodic period. During a drag, each frame's target is close to the last, so the solver converges in a few iterations — 60 fps is achievable.
- **Retrograde UX:** when multiple solutions exist in-window, prefer continuity (same direction of time travel as the drag). Show a subtle retrograde glyph so a "sticky" drag reads as astronomy, not a bug.
- **Drag ratios as feature:** Moon ≈ 13°/day (fine scrubbing), Jupiter ≈ 1°/12 days, Pluto ≈ 1°/8 months (decade jumps). Document in a tooltip — it's inherently shareable ("I dragged Pluto and landed in 2247").

C1 owns this; B1 must expose `longitudeAt(planet, t)` cheap enough to call ~50×/frame.

---

## 5. Theme Spec — "Old Nautical"

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A1628` (deep navy) | background, radial vignette to `#060D18` |
| `--line` | `#6B7684` (slate gray) | ring strokes, ticks, house lines |
| `--line-faint` | `#3A4556` | minor ticks, grid |
| `--gold` | `#C9A227` | zodiac sign glyphs, ring accents |
| `--gold-bright` | `#E8C547` | "now" marker, buttons |
| `--planet` | `#AEB9C4` (silver) | planet & node glyphs, their tick marks |
| `--planet-bright` | `#E2EAF2` | planet hover/drag state |
| `--soft` | `#6FA08B` (verdigris) | trine & sextile lines |
| `--hard` | `#6E9BC5` (steel blue) | square & opposition lines |
| `--parchment` | `#E8DCC4` | body text on panels, conjunction lines |

- Wheel styled as a **compass rose / astrolabe**: fine double-ring border, degree ticks like a sextant scale, rhumb-line cross faint in the center.
- Color semantics: **signs gold, planets/nodes silver** so the two layers read instantly. Aspect lines: conjunction parchment, soft (trine/sextile) verdigris, hard (square/opposition) steel blue — plus dash patterns so type reads without color. **Never red, pink, purple, or orange/yellow** (owner preference; orange/yellow collide with the gold). All astrological symbols (signs U+2648–2653, planets, nodes ☊☋) carry U+FE0E to force monochrome text glyphs — otherwise Apple renders them as purple emoji. Per-glyph optical size correction (☉ draws small: bump it).
- Type: serif display (e.g., Cormorant/IM Fell) for headings, humanist sans for UI. Planet glyphs from a single custom SVG sprite so they engrave-render at any size.
- Texture restraint: one subtle parchment-noise overlay at low opacity; no skeuomorphic clutter — performance and readability first.

---

## 6. Monetization

### Ads (primary)
Organic search drives ~50% of traffic to incumbents; astro-seek does ~6.2M visits/month, so millions of pageviews are realistic in this niche. The plan attacks it three ways: (1) **programmatic SEO** — every aspect × planet pair, every sign, a daily sky page = thousands of long-tail pages that each carry ads; (2) **the toy itself** — the draggable clock is linkable/embeddable in a way incumbents' static charts aren't; (3) **share loops** — natal/synastry results with OG images. Ads go on content pages and below the wheel, never over the interaction — session depth is the asset.

### MCP server (secondary — honest assessment)
**Yes, you can charge for it in 2026, but treat it as a growth channel first and revenue second.** The rails now exist: Stripe's Machine Payments Protocol handles per-request machine payments and works with MCP; the x402 protocol has settled ~$50M cumulative volume; marketplaces like MCPize (85% rev share) and Apify (pay-per-call Actors, ~80% share) handle hosting/billing/discovery. Anthropic's connectors directory provides distribution (not payment).

Realistic strategy:

1. **Free tier as marketing.** `get_current_chart` / `get_aspects` free with attribution + link. Every LLM chat that uses it cites the site → brand + backlinks + traffic. This is SEO for the AI era; astrology questions are a huge LLM use case.
2. **Paid tier for volume/depth.** Natal, transits, synastry, batch/historical queries behind API keys — flat $/month or per-call via Stripe MPP/x402. List on MCPize + Apify + Anthropic directory.
3. **Expectation:** ads scale with the audience; MCP revenue is likely hundreds-to-low-thousands $/month until agentic traffic matures — but the free tier's traffic contribution may exceed its direct revenue. Build it thin (D2 imports `astro-core`, so it's ~a week of agent work, not a second product).

---

## 7. Risks

- **Solver jank on low-end mobile** — mitigate: memoized coarse lookup table per planet + refinement; E2 gates on mid-tier Android.
- **SEO takes months** — mitigate: publish content pages (D1) in phase 1, not after launch; the clock alone won't rank.
- **Ad policy** — AdSense is fine with astrology content, but avoid "fortune telling for payment" claims in copy; frame explanations as tradition/interpretation.
- **Accuracy credibility** — astrologers will check against astro.com; E2's audit vs reference tables is a launch blocker, not a nice-to-have.
- **License** — keep Swiss Ephemeris out of the dependency tree entirely (transitive deps included).

## 8. Definition of Done (v1 launch)

Live clock accurate to <0.1° vs reference (nodes: mean node, audited against reference *mean* node); all 12 points (Sun–Pluto + lunar nodes) draggable at ≥30 fps on mid-tier mobile; 5 aspect types with correct orbs and tap-to-explain; date + birthdate inputs working; ≥500 indexed content pages; PWA installable; MCP server live with free tier + one paid path; ads serving on content pages; Lighthouse mobile ≥90.
