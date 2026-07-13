# Starcharts | Multi-Agent Build Plan

An interactive astrology clock: the chart wheel for *today*, planets you can **drag** to travel through time, aspect lines drawn live. Old-nautical theme (dark navy, gray linework, gold accents). Goal: mass engagement → ad revenue. An MCP server as a paid API surface is a deferred, post-v1 direction: it is out of P1 scope and no part of it launches in v1 (owner decision 2026-07-12).

---

## 1. Product Summary

**Core loop (the hook):** The wheel shows current planetary positions. Grab any planet and drag it around the zodiac, the *date changes* to match (drag the Moon for hours/days, drag Saturn for years, drag Pluto for centuries). Aspect lines (conjunction, sextile, square, trine, opposition) appear/dissolve as you scrub. This is a time machine disguised as a clock.

**Positioning (decided): the casual astrology consumer.** Deep astrological tooling (houses, house systems, exotic points, Vedic) already exists, astro-seek on the web, several tool-heavy MCP servers. Starcharts does NOT compete on depth. It competes on being the most delightful, legible way to see the sky and understand aspects. Every feature decision filters through "would someone with casual interest get it in 5 seconds?" Depth features stay deferred (P3) unless casual traction proves demand for them.

**Features by tier:**

| Tier | Feature |
|---|---|
| P0 | Live clock for now; draggable planets ↔ date; aspect lines with orbs |
| P0 | Aspect explanations (tap a line → meaning) |
| P1 | Date input → jump the clock/chart to any specific date. This is the only date/birth-data feature in P1: v1 launches with live-clock + drag + date entry, and every birth-data feature below waits for P2. |
| P2 | Birthdate input → natal overlay + transit-to-natal aspects (moved P1 → P2 on 2026-07-12 to trim the v1 scope to date scrubbing only; the code already shipped, this is a launch-sequencing decision) |
| P2 | **Big Three: Sun, Moon, Rising.** Rising sign out of the house deferral (C3, B3 §8): birth time + city search → Ascendant via sidereal time, Whole Sign ring in natal mode only. The #1 casual question; it needs a time + place but NOT a house system. Moved P1 → P2 on 2026-07-12 with the natal input it depends on. Full house systems stay P3 below. |
| P1 | **Moon phase + void-of-course Moon** on the sky-today surface (B3 §5–6, D4): casual daily-return hook, computed-data SEO. |
| P1 | **Planet-in-sign pages** (D3): 144 "Venus in Leo" pages, the largest missing casual content family, with computed next-in-sign dates. |
| P1 | **Luminary-weighted orbs** (B3 §2): Sun and Moon carry wider orbs than other points, so aspect cutoffs read correctly to anyone who charts. |
| P1 | **Aspect-importance scoring** (B3 §9): one pure astro-core function, `aspectStrength(pair, mode)`, scoring any two points from orb tightness (dominant factor), aspect type, and bodies involved (luminary weighting). A `mode` parameter selects the extra terms: **transit** adds applying-vs-separating and duration/rarity (fast Moon down-weighted); **natal** drops the time-based terms (static snapshot) and adds a target-significance term so aspects to the Sun/Moon/Ascendant rank highest; **transit-to-natal** keeps the time terms and weights by the natal point being hit; **synastry** weights cross-chart luminary/angle contacts. C2 (transit-to-natal list) and the P2 synastry grid consume this same function, not their own. Drives "highlight the top aspects" on the clock and orders every aspect list. Deterministic, no ML, no per-request cost; tested against astronomical invariants, not snapshots. Foundation for later daily/personalized readings. |
| P2 | **Chiron** (B3 §4, decided): precomputed JPL Horizons longitude table, 1900–2100, cubic-interpolated (never Swiss Ephemeris). Opt-in on the wheel, off by default; hidden outside the table range. The one documented exception to the pure-astronomy-engine model. |
| P2 | **Quincunx** (150°) behind a toggle (B3 §7, decided): the only minor aspect in v1, off by default, steel-blue fine dash, 2° orb. Other minors deferred until depth proves demand. |
| P3: deferred | Numbered houses + house **systems** (Equal, Placidus; Whole Sign ships early with rising sign, see P1). **On hold: less is more.** The v1 wheel stays house-free except the optional Whole Sign ring. The plan when we build the rest: Placidus via iterative semi-arc with Whole Sign fallback above the polar circle, house ring rendered only in natal mode, house pages `/houses/1`–`/houses/12` with tooltips + clickthrough matching the sign/aspect pattern, all math in astro-core, optional `houseSystem` param on MCP natal tools (the `lat`/`lon` input and Ascendant/MC math land early in C3 / B3 §8) |
| P2 | Second birthdate → synastry (two natal charts + inter-aspects) |
| P2 | Shareable chart URLs + OG images ("my chart" virality) |
| P2 | **Paid reports** (natal, year ahead, relationship blueprint): one-time PDF via Merchant of Record, global, no account. Generated by `interpret.ts`, ranked by `aspectStrength`. Ships in P2, may slip to P3; not a v1-launch blocker. See §6 and `docs/pricing-and-accounts-evaluation.md` |
| P2 | **Printable chart PDF** (E3, added 2026-07-12): downloadable print-ready PDF of the natal chart wheel, the same `chart-svg` render at print resolution, delivered as a digital file the buyer prints themselves (no POD, no inventory, no shipping). The keepsake artifact alongside the interpretation reports: reports sell the meaning, the chart PDF sells the picture. A pure digital good, so it reuses the reports' Merchant-of-Record checkout, delivery, and legal framing with no separate tax or shipping surface. Ships in P2, may slip to P3; not a v1-launch blocker. See §6 and `tasks/e3-printed-charts.md` |

---

## 2. Architecture

- **Framework:** Next.js (App Router). Interactive wheel is a client component; explanation/SEO pages are server-rendered. PWA via manifest + service worker, one codebase for web and mobile.
- **Ephemeris:** [`astronomy-engine`](https://www.npmjs.com/package/astronomy-engine) (MIT, ~100 KB, no data files, runs client-side). Accuracy ≈1 arcminute, far tighter than any aspect orb (degrees). **Do not use Swiss Ephemeris**: it's AGPL or paid commercial license, poison for an ad-monetized closed site.
- **Rendering:** Hand-built SVG (not a chart library). Layers: zodiac ring → degree ticks → house lines (natal mode) → aspect lines → planet glyphs. SVG scales crisply, animates via CSS/spring, and doubles as the OG-image renderer server-side.
- **State:** Single source of truth = a UTC timestamp. Everything (positions, aspects, URL) derives from it. Drag interaction *writes* the timestamp via the inverse solver (§4, Agent C2).
- **MCP server:** Separate lightweight service (Node, streamable-HTTP transport) sharing the same core calc package. Deployed alongside the site.
- **Hosting (updated 2026-07-12): Firebase App Hosting.** The web app deploys to Firebase App Hosting, which builds the Next.js app and serves SSR/ISR on managed Cloud Run behind Google's CDN (scale-to-zero ≈ $0 pre-launch, autoscales with ad traffic). GitHub-connected: a push to `main` triggers a build + rollout, no self-managed Terraform, Dockerfiles, or deploy pipeline. Edge is **Cloudflare proxied in front** of App Hosting: content routes cached at the free edge (respecting ISR TTLs), Bot Fight + a rate-limit rule, keeping egress near $0. That means the App Hosting origin should be fenced so it cannot be reached past Cloudflare (security-audit NET-1). The earlier hand-built stack (Cloud Run containers via Terraform in `infra/`, GitHub Actions + Workload Identity Federation, Cloud Armor for MCP) was retired in this move. See `docs/firebase-migration-runbook.md`. The MCP server stays deferred out of v1 and is not hosted.
- **Monorepo:**

```
packages/astro-core     # pure TS: positions, signs, aspects, natal, synastry, zero DOM deps
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
| A1 | **Architect** | Monorepo scaffold, shared TS types (`ChartState`, `Aspect`, `Planet`), CI, CLAUDE.md conventions | none |
| B1 | **Ephemeris Core** | `astro-core`: ecliptic longitudes for Sun–Pluto + Moon at any UTC instant; sign/degree mapping; retrograde flags; aspect detection with per-aspect orbs; unit tests vs published ephemeris tables | A1 |
| B2 | **Chart Renderer** | `chart-svg`: static wheel from a `ChartState`: zodiac ring, glyphs, aspect lines, nautical theme tokens (§5). Storybook-style fixture page | A1 |
| C1 | **Interaction: drag ↔ time** | Pointer-event drag on planet glyphs; **inverse solver** (§4); momentum/snap; Moon-drag fine control; keyboard a11y (arrows step time) | B1, B2 |
| C2 | **Date & natal input** | Date picker → chart; birthdate form → natal overlay (outer ring) + transit-to-natal aspect list; synastry mode (second birthdate, inter-aspect grid). Aspect lists ship unranked in phase 1, then order/highlight via `aspectStrength` once B3 §9 lands (natal, transit-to-natal, synastry modes) | B1, B2 |
| D1 | **Content & SEO** | Aspect explanation copy (each aspect × planet pair = a page: programmatic SEO, thousands of indexable pages, e.g. "Mars square Venus"); daily "sky today" page; sitemap; metadata | B1 |
| D2 | **MCP Server** | **DEFERRED out of v1 (owner decision 2026-07-12): paused, no part launches in P1.** `apps/mcp`: tools `get_current_chart`, `get_chart(date)`, `get_aspects(date)`, `get_natal_chart(birth)`, `get_transits(birth, date)`, `get_synastry(a, b)`; API-key auth + rate limits; free/paid tiers (§6) | B1 |
| E1 | **Growth & Ads** | AdSense/GAM slots (non-intrusive: below fold + explanation pages, never on the wheel); analytics events (drags, date jumps, shares); OG-image endpoint; share URLs encoding chart state | C1, D1 |
| E2 | **QA & Performance** | Position accuracy audit vs astro.com output; drag solver correctness under retrograde; Lighthouse ≥90 mobile; cross-browser pointer events; PWA install flow | C1, C2 (D2 dropped: MCP deferred out of v1) |
| E3 | **Commerce: printable chart PDF** | Downloadable print-ready natal chart PDF: `chart-svg` at print resolution, size/colorway configurator, guest checkout and download/email delivery via the reports' Merchant-of-Record pipeline (digital good, no shipping). See `tasks/e3-printed-charts.md` | B2, C2, C3, paid-reports checkout |
| E4 | **Privacy policy & consent** | `/privacy` page + sitewide footer link; ad-consent (GDPR/UK, CCPA, Google consent mode v2, certified CMP for EEA/UK AdSense); disclose analytics + ad cookies; state v1 collects no birth data. Required once ads ship. See `tasks/e4-privacy-policy.md` | E1 |
| F1 | **Hosting (Firebase App Hosting)** | Web app on Firebase App Hosting (managed Cloud Run + CDN, GitHub-connected auto-deploy on `main`, `apphosting.yaml` scale-to-zero). Replaces the retired Terraform/Cloud Run/Docker/WIF stack. v1 deploys web only; MCP deferred and unhosted. See `docs/firebase-migration-runbook.md` | A1 |
| R1 | **Market Research** | Competitive landscape (`docs/competitive-strategy.md`): incumbents, feature/SEO gaps, positioning, refresh quarterly. Runs parallel to build agents; feeds D1 (content targets) and E1 (growth loops) | none |
| B3 | **Ephemeris Core: extensions** | `astro-core`: Sun/Moon true-speed fix, luminary-weighted orbs (`orbFor`), aspect-importance scoring (`aspectStrength`, §9), moon-phase + void-of-course APIs, Ascendant/MC math (Whole Sign, no Placidus), optional minor aspects; Chiron table pending owner sign-off. (True-node option dropped 2026-07-12: Mean node only.) All astronomical-invariant tests. See `tasks/b3-ephemeris-extensions.md` | B1 |
| C3 | **Rising Sign & location** | Birth time + city-search geocoding (lat/lon + IANA tz), historical local→UTC conversion, Big Three panel, Whole Sign ring in natal mode. See `tasks/c3-rising-sign.md` | B3 (§8), C2 |
| D3 | **Planet-in-sign content** | 144 (or 156 w/ Chiron) `/planets/{point}/{sign}` pages: computed next-in-sign dates + composed non-repetitive copy + embedded wheel; reciprocal planet/sign hub links. See `tasks/d3-planet-in-sign.md` | B1 |
| D4 | **Sky Today: Moon** | Moon phase (graphic + illumination + sign) and void-of-course status on the sky-today surface; `/moon` explainer; optional VoC calendar. See `tasks/d4-sky-today-moon.md` | B3 (§5–6) |
| D5 | **Content depth** | Deepen meaning pages: unique aspect interpretations, sign/planet hubs, and responsive server-side SVG aspect strength graphs over time. See `tasks/d5-content-depth.md` | D1, B3 |

**Orchestration rules:** one agent = one session (worktree isolation when touching shared files). Rows execute in dependency order, A → {B1,B2} parallel → {C1,C2,D1,D2} parallel → {E1,E2}; R1 anytime. Research/strategy agents (R-row) never edit code; build agents never edit `docs/strategy`. Every build agent ends by running `npm test` and updating its brief's status line; E2 re-verifies everything before launch. Cross-agent contracts (types, interfaces, theme tokens) change only via PLAN.md edits, so agents can't silently diverge.

**Parallelism:** after A1 → {B1, B2} run in parallel → {C1, C2, D1, D2} largely parallel → {E1, E2}. No cycles.

**Phase 2 (post-initial-build, casual-depth additions):** B3 extends astro-core and gates the rest, it must land first. Then C3 (rising sign, needs B3 §8 + C2), D3 (planet-in-sign, needs only B1), D4 (sky-today Moon, needs B3 §5–6), and D5 (content depth, needs D1 + B3) run in parallel. Order: B3 → {C3, D3, D4, D5}. Still no cycles. E2 re-runs every new test; E1 picks up the Big-Three and planet-in-sign OG images.

**Suggested execution:** A1 as one session; B1+B2 as two parallel worktree agents; then C-row; D-row anytime after B1; E-row last. Every agent's acceptance criteria include tests the E2 agent re-runs.

---

## 4. The Hard Problem: Drag → Date (inverse ephemeris)

Forward is easy (date → longitudes). Dragging inverts it: *given planet P at longitude λ, what date?* Non-trivial because:

- **Non-unique:** every planet returns to λ each orbit; Mercury/Venus/Mars cross λ up to 3× near retrograde loops.
- **Solution:** search *nearest in time* to the current chart date. Bisection/secant on `longitude(P, t) − λ` within a window scaled to P's synodic period. During a drag, each frame's target is close to the last, so the solver converges in a few iterations, 60 fps is achievable.
- **Retrograde UX:** when multiple solutions exist in-window, prefer continuity (same direction of time travel as the drag). Show a subtle retrograde glyph so a "sticky" drag reads as astronomy, not a bug.
- **Drag ratios as feature:** Moon ≈ 13°/day (fine scrubbing), Jupiter ≈ 1°/12 days, Pluto ≈ 1°/8 months (decade jumps). Document in a tooltip, it's inherently shareable ("I dragged Pluto and landed in 2247").

C1 owns this; B1 must expose `longitudeAt(planet, t)` cheap enough to call ~50×/frame.

---

## 5. Theme Spec | "Old Nautical"

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
- Color semantics: **signs gold, planets/nodes silver** so the two layers read instantly. Aspect lines: conjunction parchment, soft (trine/sextile) verdigris, hard (square/opposition) steel blue, plus dash patterns so type reads without color. **Never red, pink, purple, or orange/yellow** (owner preference; orange/yellow collide with the gold). All astrological symbols (signs U+2648–2653, planets, nodes ☊☋, Chiron ⚷ if enabled) carry U+FE0E to force monochrome text glyphs, otherwise Apple renders them as purple emoji. Per-glyph optical size correction (☉ draws small: bump it).
- **Orbs are not a single scalar.** Base orb per aspect type (conjunction/opposition 8°, square/trine 7°, sextile 5°), widened when a luminary (Sun/Moon) is involved (B3 §2, `orbFor(type, a, b)`, implemented 2026-07-08; the aspect pages and `LiveAspectStatus` read it, no hardcoded orb text). All copy that prints an orb reads that one function, never hardcode the number. Optional minor aspects (B3 §7) render with a finer dash and stay within the sanctioned tokens (no new colors); they are off by default.
- Type: serif display (e.g., Cormorant/IM Fell) for headings, humanist sans for UI. Planet glyphs from a single custom SVG sprite so they engrave-render at any size.
- Texture restraint: one subtle parchment-noise overlay at low opacity; no skeuomorphic clutter, performance and readability first.

---

## 6. Monetization

### Ads (primary)
Organic search drives ~50% of traffic to incumbents; astro-seek does ~6.2M visits/month, so millions of pageviews are realistic in this niche. The plan attacks it three ways: (1) **programmatic SEO**, every aspect × planet pair, every sign, a daily sky page = thousands of long-tail pages that each carry ads; (2) **the toy itself**, the draggable clock is linkable/embeddable in a way incumbents' static charts aren't; (3) **share loops**, natal/synastry results with OG images. Ads go on content pages and below the wheel, never over the interaction, session depth is the asset.

The full monetization spec lives in `docs/ad-monetization-review.md` (levers ranked by dollar impact); E1 (`tasks/e1-growth-ads.md`) is the build brief. Key refinements: revenue = sessions × pages/session × viewability × RPM, so (a) AdSense is only the launch seed, graduate to a header-bidding network (Ezoic → Mediavine → Raptive) at named traffic thresholds for ~2x RPM; (b) session depth is the multiplier, internal-link rails plus a live wheel embedded on every content page; (c) build the "sky today" surface early as recurring-visit inventory; (d) add affiliate + email capture as revenue-per-visitor and Google-risk hedges. This raises soft dependencies: E1's payoff depends on content depth (thin pages under-earn and under-rank; the existing aspect/sign/planet pages shipped templated and are deepened by D5, `tasks/d5-content-depth.md`) and on the sky-today page existing.

### Paid reports (secondary, decided 2026-07-12)
Ads stay primary, but ads-only leaves the identity-invested user unmonetized and rides entirely on Google rankings. One low-friction paid lever hedges both: one-time reports (natal, "year ahead", relationship blueprint) at ~$9.99, web previews free and ad-supported, full exportable PDF paid. Generated entirely by `interpret.ts` and ranked by `aspectStrength` (no hand-written text), so marginal cost is near zero. Billed through a **Merchant of Record** (collects/remits tax globally, absorbs PCI) and designed **global from day one**. The report is a pure function of birth inputs + pinned engine version, so it regenerates deterministically and needs no stored PDF and no user account. Liability is contained by an entertainment-and-reflection framing (never prediction of fact), `interpret.ts` guardrails against medical/financial/legal/pregnancy/mortality claims, published ToS/Privacy/Refund policies, and an EU/UK withdrawal-right waiver at checkout. Scheduled for **P2** (may slip to P3); not a v1-launch blocker, so v1 ships ads-only and reports follow. Accounts, subscriptions, and a paid native app stay deferred (the PWA is the mobile strategy). Full evaluation and guardrails: `docs/pricing-and-accounts-evaluation.md`.

### Printable chart PDF (secondary, added 2026-07-12)
A second keepsake lever that shares almost all of its infrastructure with paid reports: a downloadable, print-ready PDF of the natal chart wheel. The chart is already the most screenshot-worthy thing in this market (competitive-strategy §2), so the marginal move is to let people buy a frame-worthy file of their own chart. The same `chart-svg` renderer that draws the wheel and the OG image emits a print-resolution PDF; the buyer prints it themselves, so there is no inventory, no shipping, and near-zero marginal cost. Personalized with the buyer's name, birth data, and Big Three; regenerated deterministically from the pinned engine version, so like reports it stores birth inputs, not files. Because it is a digital good it bills through the same **Merchant of Record** as reports (Paddle / Lemon Squeezy remits global tax and absorbs PCI), reuses the same download/email delivery, the entertainment-and-reflection framing, the ToS/Privacy/Refund policies, and the EU/UK immediate-delivery waiver, so it adds no shipping, tax, or PII surface beyond what reports already carry. Scheduled for **P2** (may slip to P3), not a v1-launch blocker. Build brief: `tasks/e3-printed-charts.md`.

### MCP server (secondary | honest assessment) | deferred out of v1
**Scope (owner decision 2026-07-12): the MCP server is paused and is not part of the v1 launch. No part of it ships in P1. The assessment below applies when the service resumes post-launch, it is not a v1 commitment.**

**Yes, you can charge for it in 2026, but treat it as a growth channel first and revenue second.** The rails now exist: Stripe's Machine Payments Protocol handles per-request machine payments and works with MCP; the x402 protocol has settled ~$50M cumulative volume; marketplaces like MCPize (85% rev share) and Apify (pay-per-call Actors, ~80% share) handle hosting/billing/discovery. Anthropic's connectors directory provides distribution (not payment).

Realistic strategy:

1. **Free tier as marketing.** `get_current_chart` / `get_aspects` free with attribution + link. Every LLM chat that uses it cites the site → brand + backlinks + traffic. This is SEO for the AI era; astrology questions are a huge LLM use case.
2. **Paid tier for volume/depth.** Natal, transits, synastry, batch/historical queries behind API keys, flat $/month or per-call via Stripe MPP/x402. List on MCPize + Apify + Anthropic directory.
3. **Expectation:** ads scale with the audience; MCP revenue is likely hundreds-to-low-thousands $/month until agentic traffic matures, but the free tier's traffic contribution may exceed its direct revenue. Build it thin (D2 imports `astro-core`, so it's ~a week of agent work, not a second product).

---

## 7. Risks

- **Solver jank on low-end mobile**, mitigate: memoized coarse lookup table per planet + refinement; E2 gates on mid-tier Android.
- **SEO takes months**, mitigate: publish content pages (D1) in phase 1, not after launch; the clock alone won't rank.
- **Ad policy**, AdSense is fine with astrology content, but avoid "fortune telling for payment" claims in copy; frame explanations as tradition/interpretation.
- **Accuracy credibility**, astrologers will check against astro.com; E2's audit vs reference tables is a launch blocker, not a nice-to-have.
- **License**, keep Swiss Ephemeris out of the dependency tree entirely (transitive deps included).

## 8. Definition of Done (v1 launch)

Live clock accurate to <0.1° vs reference (nodes: mean node, audited against reference *mean* node); all 12 points (Sun–Pluto + lunar nodes) draggable at ≥30 fps on mid-tier mobile; 5 aspect types with correct orbs and tap-to-explain; date input working (birthdate/natal inputs are P2, not required for v1); ≥500 indexed content pages; PWA installable; ads serving on content pages; privacy policy and ad-consent published; Lighthouse mobile ≥90. The MCP server is deferred out of v1 (owner decision 2026-07-12): it is paused and no part of it launches in P1, so it is not a v1 launch requirement.
