# Starcharts | Ad Monetization Review

**Prepared by:** growth/monetization review · **Date:** 2026-07-08 · **Feeds:** E1 (growth & ads)
**Status of the thing being reviewed:** E1 not yet built; this review rewrites its plan before implementation.

This document reviews how Starcharts plans to make money from display ads and ranks the changes by dollar impact. It assumes the strategy in `docs/competitive-strategy.md` (interaction moat, computed-data SEO, MCP distribution) and refines the monetization layer that sits on top of it. Ad revenue is the product of four things: sessions, pages per session, ad viewability, and RPM. Most of what follows moves one of those four levers; they are ordered by how much money each is worth on the traffic the strategy is already trying to win.

---

## 0. Levers, ranked

| # | Lever | Which input it moves | Rough impact | Effort |
|---|---|---|---|---|
| 1 | Graduate off AdSense to a header-bidding network (Ezoic → Mediavine → Raptive) | RPM | ~2x on identical traffic | Low (config + thresholds) |
| 2 | Internal linking + embedded live wheel on every content page | Pages/session | High (session depth = RPM value) | Medium |
| 3 | Ship "sky today" as a recurring-visit surface early | Sessions (return visits) | High, compounding | Medium |
| 4 | Deepen the thin meaning pages | Sessions (ranking) + inventory | Medium-high | Medium |
| 5 | Fix the slot map: sticky sidebar, mobile anchor, ad refresh | Viewability + units | Medium-high on high-dwell pages | Low-medium |
| 6 | Add affiliate + email capture | Revenue/visitor + Google-risk hedge | Medium, high strategic value | Medium |
| 7 | Instrument for yield (RPM by template/geo/source) | Enables all of the above | Prerequisite | Low |

---

## 1. AdSense is the ceiling, not the plan

The E1 brief names AdSense throughout. For a site aiming at millions of pageviews, AdSense is the lowest-RPM way to sell inventory: it fills from a single demand source, where header-bidding ad managers run real-time auctions across dozens of buyers and routinely pay two to four times as much for the same impressions. This is the largest single revenue lever in the whole plan, and nothing else on the list beats the multiplier.

The networks have traffic minimums, so the plan is a staircase, not a destination:

| Stage | Traffic | Network | Why |
|---|---|---|---|
| Launch | 0 → ~10k sessions/mo | **AdSense** | Season the domain, pass policy review, get clean ads.txt |
| Growth | ~10k+ sessions/mo | **Ezoic** | No hard minimum; AI-driven placement and density testing; materially higher RPM than raw AdSense; good bridge |
| Scale | 50k sessions/mo | **Mediavine** | Premium demand, strong in lifestyle/female-skew verticals (fits the astrology audience) |
| Scale | 100k pageviews/mo | **Raptive** (ex-AdThrive) | Highest-tier demand and RPM; direct-sold inventory |

Treat each threshold as a named revenue milestone with an owner and a switch-over checklist (ads.txt update, CMP compatibility, Core Web Vitals re-test after the new tag lands). Mediavine and Raptive are roughly mutually exclusive at a given time; pick on RPM at the point you qualify for both. The takeaway: build the ad layer network-agnostic (a single ad-slot component with a provider adapter) so swapping the tag is a config change, not a refactor.

---

## 2. Session depth is the real multiplier, and it is under-built

The entire ad thesis rests on astro-seek's roughly ten-minute sessions (see competitive-strategy §1). Ad revenue on a site with eight pages per session is worth several times the same traffic bouncing on page one, because more pageviews means more impressions and returning-scroll viewability. Pages per session is therefore the highest-leverage input after RPM, and today it is weak.

**Internal linking is a dead end.** The current aspect page (`apps/web/app/aspects/[slug]/page.tsx`) links out to only four destinations: the two planets, the aspect-type hub, and "all aspects." A visitor who lands from search has almost nowhere relevant to go next. It should cross-link, at minimum:

- the reverse pair (Mars square Venus ↔ Venus square Mars) and the other four aspects between the same two planets;
- "aspects active today" / the live clock, pre-scrubbed;
- the two signs those planets currently occupy;
- two or three thematically related pairs (a "you might also look at" rail).

Respect the CLAUDE.md rule that aspect-table rows on the clock link only to aspect pages and planet links live inside content only; these additions are content-page to content-page, which is allowed. Every extra quality pageview per session is money, and this is close to free.

**The embedded live wheel is the single best dwell-time feature you have.** The strategy already calls for a live mini-wheel on every content page. Prioritize it: it is the one element AI Overviews cannot inline, and it converts a one-pageview informational bounce into a multi-minute interactive session, which is exactly where ad value concentrates. A meaning page with an embedded wheel scrubbed to the next exact date of that aspect is both better SEO and better inventory than the text alone.

---

## 3. Ship "sky today" early | recurring visits are the best inventory

Bet 4 in the competitive strategy ("own the sky right now") is not yet built. A daily-updating "what is in the sky today / this week / what is retrograde now" page is a PWA daily-return habit. Return visitors on a high-engagement surface are the most valuable ad inventory a content site can own, and unlike SEO landing traffic they compound. This should jump ahead of grinding out more thin meaning pages in the E1/D1 queue, because habit traffic is worth more per session and de-risks the search-dependency the strategy flags as existential. Pair it with the PWA install prompt and a morning email (§6) so the return loop has three reinforcing channels.

---

## 4. The meaning pages are too thin to monetize or rank

The aspect pages today are roughly four short paragraphs: a one-line teaser, one interpretive paragraph reusing a generic per-type blurb, a live-status line, a next-dates table, and a muted footer. That is a double loss. Thin, templated content is what the Helpful Content system and AI Overviews punish, so it under-earns on traffic; and a short page supports few ad units and little dwell, so it under-earns per visit. The E1 "two units max, content-to-ad ratio matters" rule is treating the symptom.

The fix is depth that earns the inventory, not more ad slots on a thin page:

- unique per-pair interpretation (there is one generic sentence per aspect type today; the owner rule already demands unique teasers, extend that to the body);
- a "last exact" date and a short past/next timeline alongside the existing next-dates table;
- the embedded wheel scrubbed to the next event;
- the richer internal-link rail from §2;
- a short "how this reads in a natal chart vs as a transit" note, which also seeds the natal/synastry funnel.

Deeper pages rank better, hold attention longer, and then legitimately justify an additional in-content unit without tripping approval or the content-to-ad ratio.

---

## 5. The slot map leaves high-RPM units on the floor

The E1 slot map is conservative in ways that cost money once ads are the primary business:

- **The deferred mobile anchor is one of the highest-RPM units in display.** Deferring it on brand grounds is a content-site instinct, not an ads-primary one. Test it with real RPM data before ruling it out; keep it off the wheel/share screenshot, but content pages should try it.
- **Sticky sidebar on the clock page (desktop).** The wheel produces ten-minute sessions and the current map monetizes them with one unit below the aspect table. A sticky sidebar that never overlaps the wheel captures the rest of that dwell. This is the biggest per-session leak in the current design.
- **Ad refresh on active engagement.** On the drag toy specifically, in-policy refresh during genuinely active long sessions is a legitimate 20–40% lift, precisely because dwell is so high. Gate it on interaction/viewability so it stays within network and AdSense policy.
- **Lazy-load below-fold units** for fresh impressions on scroll. Premium networks do this automatically, which is one more reason to graduate off raw AdSense.

Keep the two guardrails that are already right: nothing on or adjacent to the wheel (accidental-click policy risk, and the clean wheel is the share asset), and every slot in a fixed-height reserved container so late-loading ads never cause layout shift. Viewability, not raw unit count, is the RPM input people forget: a sticky/anchor unit at 80% viewability beats two static units that scroll out of view.

---

## 6. Do not be display-only

Display RPM in astrology is middling. Two additions earn more per visitor and do not cannibalize display:

- **Affiliate.** This audience converts on books, tarot and reading apps, crystals and candles, "astrology gift" e-commerce, and higher-payout adjacent verticals (therapy/relationship services). A contextual "recommended reading" module on planet and aspect pages (Amazon Associates or similar) or a "get your full written report" affiliate can out-earn the display units on the same page. Keep it clearly labeled and relevant so it does not read as spam or endanger ad-network standing.
- **Email capture.** "Get the sky in your inbox each morning." Even unmonetized on day one, a list is the hedge against the Google-traffic risk the strategy doc names as existential, and it is a re-engagement engine that drives repeat ad sessions. Astrology newsletters retain unusually well; this is close to the Co-Star model applied to a web tool. Capture on the sky-today page and after a natal/synastry result, never with an interstitial over the wheel.

Also route the MCP referral loop into ad pages: the canonical URL the free MCP tools hand back should be a content page carrying ads, pre-scrubbed to the relevant chart, so every AI-cited answer becomes an ad-page referral rather than just a brand impression.

---

## 7. Instrument for yield, not just engagement

E1 plans analytics for drags, date-travel depth, aspect taps, shares, and MCP referrals. That is product instrumentation; it says nothing about which inventory earns. Add revenue-facing metrics:

- **RPM by page template** (clock vs aspect vs sign vs planet vs sky-today), so investment follows the money;
- **RPM and session value by geo**, astrology skews heavily international and tier-1 (US/UK/CA/AU) RPMs run roughly ten times tier-3, so bias the SEO wedge and default language toward tier-1 searchers;
- **RPM by traffic source** (search vs direct/PWA vs MCP referral vs share);
- **pages per session, scroll depth, ad viewability** as the leading indicators of the §2–§5 changes working;
- **consent rate** from the CMP: a well-optimized, Google-certified consent prompt materially raises EU RPM via personalized-ad opt-in, so treat consent UX as a revenue A/B test, not just a compliance checkbox.

You optimize what you measure. Without RPM-by-template you cannot tell whether the clock, sky-today, or aspect pages deserve the next hour of work.

---

## 8. Priority order for E1

1. Build the ad layer network-agnostic (slot component + provider adapter); launch on AdSense; write the migration milestones (§1).
2. Fix internal linking and embed the live wheel on content pages (§2).
3. Ship the sky-today surface with PWA return loop and email capture (§3, §6).
4. Deepen the meaning pages, then add the earned in-content unit (§4).
5. Revise the slot map: sticky sidebar on the clock, test mobile anchor, add engagement-gated refresh (§5).
6. Add the affiliate module and route MCP referrals to ad pages (§6).
7. Stand up the yield dashboard: RPM by template/geo/source, consent rate (§7).

Steps 1, 2, and 7 are the cheapest and should land first; 3 and 4 are the compounding bets; 5 and 6 are the per-session and per-visitor top-ups once traffic exists to optimize against.
