# Starcharts | Competitive Strategy

**Prepared by:** R1 Market Research · **Date:** 2026-07-07 · **Refresh:** quarterly (next due ~2026-10)
**Feeds:** D1 (content targets), E1 (growth loops). Traffic figures are third-party estimates (Similarweb/Semrush) and self-reported numbers; treat as order-of-magnitude, not gospel.

---

## 1. Landscape summary

The web astrology market is large, old, and lopsided. Two sites dominate the free-chart-tool niche Starcharts is entering: **astro-seek.com** (~11–12.6M visits/month in early 2026, ~10-minute average sessions) and **astro.com / Astrodienst** (self-reported 8–9M visitors/month, online since 1996). Both are extraordinarily deep and extraordinarily static: every chart is a page-reload form submission that renders a fixed image. Behind them sits a tier of content-led sites, **cafeastrology.com** (~5.9M visits/month, ranks #1 for "birth chart," which alone drives ~262K visits/month), **astrology.com** (~3.3M, declining sharply, −23% MoM in late 2025), **astrotheme.com** (~2.4M) and **astro-charts.com** (~1.7M, the only incumbent with genuinely modern visual design). The audience skews female (65–68%) and 25–34 across every property.

The money in this niche flows through three separate channels that barely touch: **display ads on SEO content** (astro-seek is ads-only, no paywall; cafeastrology similar), **paid reports** (astro.com's Liz Greene interpretations, a freemium model running since 1987), and **mobile subscriptions** (Co-Star ~$400K/month revenue and 30M+ users; CHANI ~$600K/month at $11.99/month; The Pattern ~$300K/month and 15M users; Sanctuary sells live readings). The apps are strong brands but deliberately shallow tools, none offers a serious web-based chart calculator, which is why the dowdy web incumbents still own the tool traffic. Meanwhile a fourth channel is forming: **astrology APIs and MCP servers for AI agents** (AstrologyAPI's 300+ endpoints, RoxyAPI with remote MCP support, the AstroVisor MCP server, several open-source MCP projects). Nobody has yet connected all four channels into one product. That gap is Starcharts.

The macro headwind is real and must shape the plan: Google AI Overviews have cut click-through on informational queries dramatically (position-1 CTR on AIO-triggered informational keywords fell from 7.3% to 1.6%; publishers report Google traffic down roughly a third in 2025). Pure "aspect meaning" text pages are exactly the query class being eaten. Interactive tools, calculators, and data that AI cannot inline, and MCP distribution *into* the AI answer layer, are the defensible plays.

### Competitor table

| Competitor | Scale (est.) | Model | Interactivity | Key weakness |
|---|---|---|---|---|
| astro-seek.com | 11–12.6M visits/mo, 10-min sessions | Display ads only, everything free | Static form → chart image; hundreds of calculators | Dated, dense UI; zero real-time interaction; one-person-scale operation |
| astro.com (Astrodienst) | ~8–9M visitors/mo (self-reported); 76% direct | Freemium: free charts, paid Liz Greene reports | Static chart drawings; powerful but 1990s-era UX | Old interface; slow to ship; no play/exploration layer |
| cafeastrology.com | ~5.9M visits/mo; #1 for "birth chart" | Display ads + report sales | Text-first; basic chart form (subdomain) | Long-scroll text pages; weakest chart visuals of the top tier |
| astrology.com | ~3.3M visits/mo, declining | Ads + readings upsell | Horoscope content, simple calculator | Losing traffic fast; generic content, thin tools |
| astrotheme.com | ~2.4M visits/mo, 63% organic | Ads + paid reports | Transit/ephemeris pages; celebrity-chart SEO | Cluttered; no modern interaction |
| astro-charts.com | ~1.7M visits/mo, 64% organic | Ads; modern free charts | Pretty static SVG charts; "chart of the moment" | Shallow features vs astro-seek; no time navigation |
| Co-Star / CHANI / Pattern / Sanctuary (apps) | 15–30M+ users each (top apps); $300–600K/mo revenue each | Subscriptions, IAP, live readings | Push-notification horoscopes, chat readings | Nearly no web tool presence; no open chart calculators |
| TimePassages / Solar Fire / LUNA (pro software) | Niche (pro astrologers) | $360 one-time (Solar Fire) / subscription (LUNA) | **Chart animation, time sliders** (closest to Starcharts) | Paid, desktop/login-gated, invisible to search traffic |
| AstrologyAPI / RoxyAPI / FreeAstrologyAPI / AstroVisor (dev) | n/a (B2B) | Credits ($11+/mo), flat plans ($39/mo), free tiers | JSON out; RoxyAPI + AstroVisor already ship MCP | No consumer brand, no traffic engine; Vedic-heavy; AstroVisor depends on Swiss Ephemeris |

### Is the drag→date mechanic actually novel?

Scoped claim, verified as far as public search allows: **time-scrubbing is not novel; inverse drag is.** The Planets Today has a speed slider on an orrery; Time Nomad (iOS) has a date slider under the chart; LUNA animates bi-wheels with a "Spacetime Navigator"; Solar Fire's animation module is a long-standing pro feature; Astrolabe's Nova Chartwheels lets you drag *whole charts* onto each other to form composites. In every one of these, the user manipulates *time* and watches planets respond. No product found, web, mobile, or desktop, lets the user grab a *planet glyph* and drag it through the zodiac while the engine inverse-solves for the date. The interaction Starcharts is building (drag Pluto, land in 2247) appears genuinely unshipped, and it is also the hard-to-copy part: it requires a fast inverse ephemeris solver with retrograde disambiguation, not a UI tweak. Expect the *idea* to be copyable within months of visibility; expect a *good implementation* (60fps, retrograde continuity, mobile touch) to take an incumbent much longer, because none of the top-3 sites has shipped any real-time interaction at all in a decade.

---

## 2. Where Starcharts wins | and where it cannot

**Starcharts wins on interaction, design, and AI-native distribution.** The entire top tier of web astrology renders static images from form posts. Astro-seek's own strength, hundreds of calculators bolted together, is its weakness: it is a reference desk, not a product. A single canonical UTC timestamp driving a 60fps draggable wheel is a categorically different experience, and it is shareable (URL-encoded chart states, OG images) in a way form results are not. Second, design: only astro-charts.com looks contemporary, and it is the shallowest of the tools; the old-nautical aesthetic gives Starcharts a distinct, screenshot-worthy identity in a market where the leaders look like 2005. Third, no incumbent web tool has meaningful MCP presence: a search of the Anthropic connectors registry for astrology/horoscope/birth-chart terms returns zero results today, and the existing astrology MCP servers are developer projects without consumer brands or traffic engines behind them.

**Where incumbents are unassailable, do not contest these.** Astro.com's credibility is a 40-year moat: Swiss Ephemeris precision, the Liz Greene report catalog, Astrodatabank, and the trust of professional astrologers. Starcharts should *benchmark against* astro.com (the E2 accuracy audit is a launch blocker precisely because astrologers will check) but never claim to replace it. Astro-seek's feature breadth, ephemeris search engines, planetary hours, retrograde calendars, every calculator imaginable, took ~15 years to accrete and drives 10-minute sessions and 48% direct traffic; matching it feature-for-feature is a losing race. Cafeastrology's #1 ranking for "birth chart" and DR-74 topical authority is not winnable on a head term in under two to three years. And the mobile apps own the app-store shelf and the push-notification relationship; Starcharts' PWA is a distribution hedge, not an app-store contender.

The honest synthesis: Starcharts cannot out-deep astro-seek, out-trust astro.com, or out-brand Co-Star. It can out-*play* all of them, and it can be first through the MCP door with a consumer brand attached.

---

## 3. Competitive strategy

### Positioning statement

For astrology-curious people who find chart sites static and overwhelming, **Starcharts is the interactive astrology clock that turns the sky into a time machine**, drag any planet and watch the date, the chart, and the aspects change live. Unlike astro-seek and astro.com, whose accurate charts are frozen images behind forms, Starcharts makes the same astronomy explorable by hand, and serves it to AI assistants through the first consumer-branded astrology MCP.

### Strategic bets, ranked

**Bet 1, The toy is the moat; instrument it like one.** The draggable wheel is the only element in this market no competitor has, and interactions are what AI Overviews cannot absorb. Everything ships subordinate to keeping the drag magical: 30fps+ on mid-tier Android, retrograde stickiness that reads as astronomy, shareable chart-state URLs with OG images. Success metric is session depth and share rate, not just visits, session depth is what makes ad inventory valuable (astro-seek's 10-minute average is the benchmark to beat).

**Bet 2, Computed-data SEO, not prose SEO.** Attack query families that require *calculation* to answer (dates, next occurrences, calendars) rather than interpretation. Astro-core can generate pages no writer at a content site can: exact future dates of every aspect for every planet pair, per year. Prose "meaning" pages still get built (they're the ad inventory and internal-link fabric) but as the second layer, with an embedded live wheel on every page so even a meaning page is an interactive artifact. Detail in the SEO wedge below.

**Bet 3, First consumer-branded astrology MCP with attribution.** Existing astrology MCPs are real but weak as competitors: AstroVisor (50 tools, Swiss Ephemeris-based, listed on mcpmarket/LobeHub), aryaminus/astro (free, self-hostable, 18 tools, Western/Vedic/BaZi), a Prokerala wrapper, RoxyAPI's remote MCP, and an Apify horoscope scraper. None is in the Anthropic connectors registry; none has a website users can be sent to; several are Vedic-first; AstroVisor's Swiss Ephemeris dependency limits its licensing flexibility in exactly the way PLAN.md avoids. The window to be *the* Western-astrology MCP with a consumer destination attached is open but will not stay open through 2027. Ship the free tier (current chart, aspects, with attribution + link), list on the Anthropic directory, mcp.so, MCPize, and Apify, and treat every AI-cited answer as a branded impression. Evidence that the demand side exists: astrology GPTs proliferate on ChatGPT, and astro-seek itself now runs a page targeting "ChatGPT AI astrology birth chart" queries, the incumbent sees the same shift but has no protocol answer, only an SEO page.

**Bet 4, Own "the sky right now" as a live surface.** Astro-seek's current-planets page dominates "current planetary positions" queries with a static table. A live, animated, embeddable "sky today" wheel is a better answer to the same intent, a natural daily-return habit (PWA re-engagement), and an embed/backlink magnet ("add today's sky to your site") that builds domain authority faster than content alone. This is the beachhead for eventually contesting bigger head terms.

**Bet 5, Synastry share loops as the growth flywheel (P2, but strategic).** The apps proved relationship astrology is the viral surface (The Pattern's whole brand; Co-Star's friend features). No web tool makes synastry results beautiful and linkable. OG-imaged synastry URLs are the cheapest borrowed-audience play available and the main path to non-search growth.

### SEO wedge: query families to attack, in order

1. **Aspect-event date queries**, "mars square venus 2026 dates," "next venus mars conjunction," "jupiter saturn conjunction 2040." Rationale: answering requires ephemeris computation; the ranking pages today are either astro-seek's *generic* year calendars (not per-pair pages) or one-off blog posts that go stale every January. Starcharts generates every pair × year × aspect page from astro-core with exact timestamps, auto-refreshed, a structural content advantage, thousands of pages, near-zero marginal cost, and each page hosts the wheel pre-scrubbed to the event date. These queries are also less exposed to AI Overviews because the searcher wants a precise, trustworthy date table and a way to explore it.
2. **Retrograde calendars, future years first**, "mercury retrograde 2027," "venus retrograde 2028." Current-year terms are contested (Almanac, Britannica, CHANI, astro-seek all rank for 2026), but future-year pages are thin everywhere because content teams write them late; a computed site publishes 2027–2035 on day one and accrues age before the queries spike.
3. **Historical sky / date-chart pages**, "planets on July 7 1996," "sky on my birthday," notable-date charts. Astro-seek has calculators but few indexable per-date artifacts; each Starcharts date URL is already a shareable chart state, so SEO pages and the share loop are the same infrastructure.
4. **Aspect meaning long tail, thin-competition combos first**, node aspects, angles-to-planet aspects, synastry variants of unglamorous pairs. The glamour pairs ("venus square mars") are saturated: cafeastrology, astro-seek (natal *and* synastry page variants), astrology.com, Astrology King, AstroMatrix, and Authority Astrology all hold programmatic pages there. Enter through the combos they skipped, interlink upward, and accept that this family is the slowest-payoff of the four, it is also the family most exposed to AI Overview cannibalization, which is priced into ranking it last.

Explicitly *not* an SEO target: "birth chart" and "natal chart calculator" head terms (cafeastrology/astro-seek own them; revisit in year two with accumulated authority) and daily sun-sign horoscope queries (brand-driven, saturated, low-quality ad traffic).

### AI/MCP distribution angle

The strategic read on the evidence: astrology is a top consumer LLM use case (astrology GPTs, prompt-list content farms, and Yahoo lifestyle coverage all confirm mainstream behavior), LLMs hallucinate planetary positions (the documented pitch of every astrology MCP), and the existing MCP supply is developer-grade without brands. Starcharts' MCP is therefore *distribution first, revenue second*, exactly as PLAN.md §6 frames it. Concretely: free tools return a `data_source: "Starcharts"` attribution with a canonical chart URL, so every AI conversation that touches the current sky can hand the user a link to the interactive wheel, the AI answer layer becomes a referral channel instead of a threat. Paid tier (natal/transits/synastry, batch, historical) competes on license cleanliness (MIT astronomy-engine vs AstroVisor's AGPL/commercial Swiss Ephemeris exposure), Western-first focus (vs Vedic-heavy incumbent APIs), and the guarantee that API numbers match the public site because both import astro-core. Revenue expectation stays modest (hundreds to low thousands $/month near-term); the KPI is MCP-attributed site sessions.

### What NOT to build

No daily horoscope content operation (saturated, brand-driven, and the most AI-cannibalized query class). No human-reading marketplace (Sanctuary's business; operations-heavy; wrong brand). No Vedic/BaZi/Human Design systems (AstrologyAPI and AstroVisor already own multi-system breadth; it would dilute the Western-tropical focus and double the accuracy-audit surface). No native app-store app (Co-Star/CHANI/Pattern own that shelf with $300–600K/month war chests; the PWA covers install intent). No AI chatbot interpreter (commodity feature every app is adding; Starcharts *feeds* AIs via MCP instead of competing with them). No paid PDF reports (astro.com has a 40-year head start and Liz Greene; unwinnable trust contest).

---

## 4. Risks and threats

**AI Overviews compress the ad model before authority accrues.** Informational CTRs are down ~50%+ where AIOs appear, and category incumbents are already bleeding (astrology.com −23% MoM; cafeastrology down in mid-2025 checks). Mitigation is baked into the strategy, computed-data pages, interactive surfaces, and MCP distribution, but if Google inlines aspect-date tables too, the ad ceiling drops materially. Watch quarterly.

**Astro-seek copies the drag.** The operator is prolific and ships constantly (they already built a ChatGPT-targeting page). Their engine and site architecture make a 60fps inverse-solver wheel a rewrite rather than a feature, but a crude slider version that blunts the novelty claim is plausible within a year of Starcharts getting visible. Mitigation: speed to market, patent-of-attention (make "drag the planets" synonymous with the Starcharts brand via shares), and depth on the interaction (natal overlay dragging, synastry) that a bolt-on can't match.

**Apps come to the web.** CHANI already ranks for editorial astrology queries ("2026 mercury retrogrades") and has revenue to fund a web tool team. An app-brand launching a free interactive web chart would combine brand trust with modern UX, the true nightmare scenario. No evidence any of them is building tool-SEO today; monitor their careers pages and web features quarterly.

**Accuracy credibility failure.** One viral thread showing Starcharts disagreeing with astro.com by half a degree kills the astrologer segment. The E2 audit against reference tables (and mean-node convention documentation) is a launch blocker, and the marketing must never overclaim precision.

**MCP market timing.** Agentic traffic and machine payments (x402, Stripe MPP) may mature slower than hoped; the paid MCP tier could stay negligible through 2027. Acceptable because the free tier's referral value is the real prize, but do not staff or spend as if API revenue is coming soon.

**Traffic-estimate fragility.** Similarweb/Semrush figures above disagree with each other by 2× in places (e.g., cafeastrology 2.3M vs 5.9M depending on source and month). Strategy conclusions here rest on relative scale and structure, not precise counts; re-pull numbers at each quarterly refresh.

---

## 5. Sources

Traffic and scale
- https://www.similarweb.com/website/astro-seek.com/ (11.3M visits Feb 2026; demographics; direct 47.9%)
- https://www.semrush.com/website/astro-seek.com/overview/ (12.59M visits Apr 2026; 10:04 avg session)
- https://www.similarweb.com/website/astro.com/ (rank #3892; direct 76.4%)
- https://www.astro.com/index_e.htm and https://www.astro.com/contact/contact_about_e.htm (self-reported 8–9M visitors/month; company history since 1987/1996)
- https://www.semrush.com/website/cafeastrology.com/overview/ (5.94M visits Apr 2026)
- https://ahrefs.com/websites/cafeastrology.com (DR 74; #1 for "birth chart," ~262K monthly visits from keyword)
- https://www.similarweb.com/website/astrology.com/ and https://www.semrush.com/website/astrology.com/overview/ (3.27M Sept 2025; −23.42% MoM)
- https://www.similarweb.com/website/astrotheme.com/vs/astro-charts.com/ (astrotheme ~2.4M; astro-charts ~1.7M; organic ~63% both)

Apps
- https://www.statista.com/statistics/1451664/top-horoscope-apps-us-market-revenue/ (top-grossing US astrology apps)
- https://app.sensortower.com/overview/1264782561?country=US (Co-Star ~$400K/mo revenue, ~100K downloads/mo)
- https://www.crunchbase.com/organization/co-star (Co-Star funding, $15M round)
- https://app.sensortower.com/overview/1532791252?country=US and https://chaninicholas.zendesk.com/hc/en-us/articles/1500001732281-App-Pricing (CHANI ~$600K/mo; $11.99/mo pricing)
- https://app.sensortower.com/overview/1071085727?country=US and https://time.com/6083293/astrology-apps-personalized/ (The Pattern ~$300K/mo, 15M users; Sanctuary $3M raised, live readings model)
- https://astrograph.com/astrology-software (TimePassages positioning, pro users)
- https://www.researchandmarkets.com/reports/6090017/astrology-app-market-report (market $4.73B 2025 → $5.69B 2026)

Interactivity prior art (novelty check)
- https://www.lunaastrology.com/ (LUNA Spacetime Navigator; animated bi-wheels; drag-and-drop charts)
- https://alabe.com/novacw.html (Nova Chartwheels: drag chart onto chart for composites)
- https://alabe.com/solarfireV9.html and https://www.techjockey.com/detail/solarfire (Solar Fire chart animation; ~$360)
- https://timenomad.app/documentation/accurate-natal-birth-chart-calculator-software.html (Time Nomad date slider)
- https://www.theplanetstoday.com/astrology.html (time-speed slider orrery)
- https://astro-charts.com/chart-of-moment/ (pick-a-date redraw, no direct manipulation)

APIs and MCP
- https://astrologyapi.com/pricing (credit model, 300+ endpoints, 50 free credits)
- https://roxyapi.com/blogs/best-astrology-apis-2026-developer-comparison and https://roxyapi.com/products/astrology-api ($39/mo flat; remote MCP support for OpenAI/Anthropic/Gemini agents)
- https://freeastrologyapi.com/pricing (100% free; Western natal/synastry/transits; SVG wheels)
- https://astrology-api.io/pricing (free 50 req/mo; $11/mo tier)
- https://github.com/rokoss21/astrovisor-mcp and https://astrovisor.io/ (AstroVisor MCP: 50 tools, 95+ endpoints, Swiss Ephemeris)
- https://mcpmarket.com/server/astrovisor and https://lobehub.com/mcp/rokoss21-astrovisor-mcp (AstroVisor directory listings)
- https://github.com/aryaminus/astro (free self-hostable astrology MCP: 18 tools, Western/Vedic/BaZi)
- https://github.com/sajithamma/prokerala-mcp-server (Prokerala Vedic MCP wrapper)
- https://apify.com/vivid_astronaut/horoscope/api/mcp (Apify horoscope scraper actor with MCP)
- Anthropic connectors registry search for astrology/horoscope/birth-chart terms: zero results (checked 2026-07-07 via MCP registry search)

SEO landscape
- https://horoscopes.astro-seek.com/venus-square-mars-natal-aspect-meaning and https://horoscopes.astro-seek.com/mars-square-venus-synastry-aspect-meaning (astro-seek programmatic aspect pages, natal + synastry variants)
- https://cafeastrology.com/natal/venusmarsaspects.html and https://www.astrology.com/aspects-transits/venus-square-mars/ (incumbent aspect-meaning coverage)
- https://www.almanac.com/content/mercury-retrograde-dates, https://www.chani.com/this-year/key-dates/2026-astrological-key-dates-mercury-retrogrades, https://horoscopes.astro-seek.com/mercury-retrograde-astrology-calendar-2026 (retrograde SERP incumbents)
- https://horoscopes.astro-seek.com/current-planets-astrology-transits-planetary-positions (current-planets dominance)
- https://horoscopes.astro-seek.com/chatgpt-ai-astrology-free-birth-chart (astro-seek targeting AI-astrology queries)
- https://www.keysearch.co/top-keywords/astrology-keywords and https://www.theseolabs.com/keywords-lists/astrology/ (astrology keyword volume references)

AI search headwinds
- https://pressgazette.co.uk/media-audience-and-business-data/google-traffic-down-2025-trends-report-2026/ (Google publisher traffic −33% in 2025; US −38%)
- https://almcorp.com/blog/google-ai-overviews-publisher-traffic-decline-antitrust-lawsuit-analysis/ (58% CTR decline; position-1 CTR 7.3% → 1.6% on AIO informational queries)
- https://www.adexchanger.com/publishers/the-ai-search-reckoning-is-dismantling-open-web-traffic-and-publishers-may-never-recover/ (publisher sentiment)

LLM astrology demand
- https://www.yahoo.com/lifestyle/articles/astrology-birth-chart-ai-heres-202700648.html (mainstream AI birth-chart usage)
- https://chatgpt.com/g/g-lR71uxlCa-astrology-birth-chart-gpt (example of proliferating astrology GPTs)
- https://artificialinquiry.substack.com/p/the-stars-dont-lie-but-your-chatbot (LLM chart hallucination problem)

Monetization context
- https://www.astro-seek.com/faq and https://my-zodiac-ai.com/blog/astro-seek-vs-my-zodiac-ai-2026 (astro-seek ads-only model, no paywall)
- https://www.astro.com/prod/pr_reportsgreene_e.htm (Liz Greene paid report catalog)
