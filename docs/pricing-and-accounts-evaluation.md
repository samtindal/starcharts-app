# Starcharts | Pricing, Accounts & Monetization Evaluation

**Prepared by:** monetization/strategy review · **Date:** 2026-07-12 · **Feeds:** PLAN.md §6, E1 (growth & ads)
**Status:** evaluation for owner decision. Recreated in-repo (an earlier version lived outside the project). Reconciles the ads-primary plan in `docs/ad-monetization-review.md` with later thinking on freemium, accounts, paid reports, and a paid mobile app.

This document answers one question: is ads-primary the right monetization model for Starcharts, or should it be freemium, subscription, paid reports, a paid app, or some combination? It assumes the positioning in `docs/competitive-strategy.md` (casual audience, interaction moat, computed-data SEO) and the ad mechanics in `docs/ad-monetization-review.md`.

---

## 0. The recommendation, up front

**Keep ads as the primary engine. Add exactly one paid lever: one-time paid reports (natal, "year ahead") at roughly $9.99, generated programmatically and requiring no account. Defer subscriptions, user accounts, and a paid native app.**

Ads-primary is not a lazy default. It fits the two structural facts about Starcharts: a programmatic-SEO long-tail engine and a toy that drives session depth. But ads-only leaves the identity-invested slice of users unmonetized and concentrates all revenue on Google rankings we do not control. A single low-friction paid lever, paid PDF reports, captures that slice and hedges the Google risk without the complexity that would fight both the casual positioning and the stateless architecture.

---

## 1. The word-unscrambler test: does the ads model transfer?

The prompt for this review was an observation that simple, high-traffic utility sites (word unscramblers, anagram solvers) earn well from ads alone. That is true, and the reasons are worth naming because they tell us how much of the model transfers.

Those sites win because revenue is `sessions × pages/session × viewability × RPM`, and simplicity maximizes every term: huge long-tail search volume, many pageviews per visit (you solve word after word), zero emotional friction, no reason to register, and fast static pages.

| Factor | Word unscrambler | Starcharts | Transfers? |
|---|---|---|---|
| Long-tail SEO volume | Very high | High (aspect pairs, planet-in-sign, sky-today) | Yes |
| Pages per session | High (repeat solves) | Medium-high (the draggable toy + link rails) | Mostly |
| Simplicity of pages | Extreme | High, if we hold the line | Yes |
| Return-visit hook | Weak (utility, then leave) | Strong (sky-today, daily Moon) | Better here |
| Intent | Pure utility | Mixed: utility + entertainment + identity | Diverges |
| Willingness to pay | Near zero | Real for identity/keepsake content | Diverges |

The first four rows say ads-primary is a genuine structural match, not a stretch. The last two rows are where astrology differs and where the pure-ad ceiling shows.

**Where it diverges:**

1. **Intent is mixed, not pure utility.** A solver user wants an answer and leaves. Astrology splits into utility ("what is my rising sign"), entertainment, and identity ("my natal chart", "my year ahead"). The identity bucket is emotionally invested, and emotional investment is what people pay for. Pure ads leave it on the table.
2. **Google is a single point of failure.** Programmatic-SEO sites were the largest casualties of Google's 2023 to 2024 helpful-content updates. If most revenue rides on rankings we do not control, one update can halve the business. Ads-only concentrates that risk.
3. **A paying market already exists.** astro.com sells one-time PDF reports (~$9.99); Co-Star, Sanctuary, and The Pattern run subscriptions. The lowest-friction proof point is the paid report: people buy a keepsake reading with no subscription and often no account.

---

## 2. Options evaluated

### A. Ads only

The current plan. Revenue scales with traffic and session depth; the SEO engine and toy do the work; AdSense seeds and graduates up the network staircase (Ezoic to Mediavine to Raptive) for ~2x RPM.

- **Fit with positioning:** excellent. Simplicity is the asset.
- **Pros:** no billing, no accounts, no support/refunds/churn, no PII storage, coherent with the stateless architecture and the existing E1 brief.
- **Cons:** revenue ceiling is `traffic × RPM`; astrology RPMs are moderate (some advertisers avoid mysticism); 100% exposed to Google algorithm risk; ignores proven willingness to pay.

### B. Ads + one-time paid reports (recommended)

Ads stay primary. Add a one-time purchase for polished, exportable reports (see §3). Web previews and summaries stay free and ad-supported; the full PDF is ~$9.99. Generated entirely programmatically via `interpret.ts`, ranked by `aspectStrength` to surface the top themes. Checkout via Stripe, guest checkout, no account required (delivery by download or emailed link).

- **Fit with positioning:** strong. The free product stays simple; paying is opt-in and never gates the toy.
- **Pros:** captures the identity slice; hedges Google risk with a non-ad revenue line; high margin (compute is cheap, no inventory); respects the no-hand-written-text rule; a checkout is far less complexity than an account system.
- **Cons:** adds a payment integration and a PDF pipeline; conversion on casual traffic is low in percentage terms (but on large traffic the absolute numbers matter, and it is pure upside on top of ads).

### C. Freemium with accounts + subscription

Free tier plus a Premium subscription (saved charts, unlimited reports, notifications, ad-free). Requires user accounts.

- **Fit with positioning:** weak for the casual audience. Subscriptions reward retention and depth; the product is deliberately casual and shallow.
- **Pros:** recurring revenue; higher lifetime value from the minority who convert; enables notifications and saved charts.
- **Cons:** heavy. Auth, billing, churn management, support. Accounts mean storing birth date/time/location, which is sensitive PII and triggers GDPR/CCPA obligations the current URL-encoded-state design avoids entirely. Casual audiences convert to subscriptions at low single-digit percentages. This is a different product than PLAN.md describes.

### D. Paid mobile app (or a combination)

A separate native app, paid upfront or via in-app purchase.

- **Fit with positioning:** poor as proposed. The PWA is already the mobile strategy on one codebase.
- **Pros:** app-store presence; push notifications; a home-screen icon.
- **Cons:** second codebase and maintenance; 15 to 30% store cut; discovery is hard for a new app; upfront-paid conversion is terrible for a casual toy with free web competitors; IAP/freemium-in-app adds the most complexity of any option. Fragments effort away from the SEO engine that actually drives the business.

---

## 3. The reports catalog (the paid surface in option B)

All generated programmatically, no hand-written text, top themes selected by `aspectStrength` (mode-aware ranking, tuned to weight rarity and planet importance, not just orb exactness; see the ranking notes in `packages/astro-core`).

| Report | Audience | Free surface | Paid surface |
|---|---|---|---|
| Year Ahead (transit forecast) | Anyone with a birth date | Top 3 themes, on-page | Full 12-month PDF, ranked transits, timeline |
| Natal Analysis | Casual + curious | Big Three + summary | Full natal PDF: every placement + aspect interpretation |
| Relationship Blueprint (synastry) | Couples | Compatibility snapshot | Full synastry PDF, inter-aspect breakdown |

The "Year Ahead" is the strongest paid candidate: it has a natural annual purchase cadence, an obvious gift use case, and it showcases `aspectStrength` ranking (filtering a noisy year down to the transits that matter). The aspect-strength-over-time graph (D5) is the free teaser that sells the paid forecast.

---

## 3a. Paid reports: scalable and low-liability by design

Two owner decisions (2026-07-12) anchor the design: bill through a **Merchant of Record**, and plan for a **global** market from day one. Both choices are chosen specifically to keep the operation lean and the liability contained. This is a design summary, not legal advice; the tax-registration and fortune-telling-statute points below should be confirmed with counsel before launch.

**Billing: Merchant of Record (Paddle or Lemon Squeezy).** The MoR becomes the legal seller of record and collects and remits sales tax and VAT in every jurisdiction, and it absorbs PCI scope because card data never touches our systems. This is the single biggest scalability lever: without it, selling globally would mean registering and remitting tax across many US states and every country we sell into, which does not scale for a lean operation. The trade is a slightly higher per-transaction fee, which is worth it to keep reports a passive revenue line rather than a compliance job.

**Scale: stateless, deterministic regeneration.** A report is a pure function of birth datetime, lat/lon, report type, and engine version. We therefore never need to store the generated PDF: the purchase record holds only the input parameters, report type, buyer email, and pinned engine version, and the report regenerates deterministically on demand. Caching the PDF in object storage behind a signed URL is a pure optimization, not the system of record. Marginal cost per report is a few cents of compute on Cloud Run (scale-to-zero), and storing less birth data is also a privacy win.

**Engine-version pinning.** Each purchase record pins the `astro-core` / `interpret.ts` version used. A later engine change then cannot silently alter a report someone already paid for, which protects both reproducibility and the buyer relationship.

**Liability guardrails:**

| Risk | Mitigation |
|---|---|
| Fortune-telling-for-payment statutes (and AdSense sensitivity, PLAN.md §7) | Prominent "for entertainment and reflection" disclaimer in the report and at checkout; copy frames astrology as tradition and interpretation, never prediction of fact |
| Harmful actionable output | `interpret.ts` templates never produce medical, financial, legal, pregnancy, or mortality predictions; enforced once in the content layer, not per report (also a user-wellbeing guardrail) |
| Consumer / refund law | Published Terms of Service, Privacy Policy, and Refund Policy |
| EU/UK 14-day digital withdrawal right | Checkout requires active consent to immediate delivery and acknowledgement of waiving the withdrawal right; consent is logged |
| Sensitive PII (birth date, time, place) | Minimize stored data (stateless regeneration), privacy policy, processor agreement for report-delivery email, encryption at rest, retention limits |
| Payment / PCI | Handled entirely by the Merchant of Record's hosted checkout |

Net effect: the paid-reports lever adds a checkout and a PDF pipeline, not an account system or a tax operation, so it stays consistent with the casual positioning and the stateless architecture while hedging Google-ranking risk.

## 4. Accounts: needed or not

Not for v1, and there is an architectural reason to avoid them. Starcharts derives all chart state from one URL-encoded timestamp, so "save my chart" already works via a shareable URL and `localStorage`, with no server-side storage of birth data. Introducing accounts converts sensitive PII (birth date, time, place) into stored data and inherits the full GDPR/CCPA compliance burden. Optional, lightweight email capture (for report delivery and a newsletter) gives most of the retention upside of accounts at a fraction of the cost and risk. Full accounts belong in Phase 3, and only if a subscription is chosen.

---

## 5. Phased roadmap

| Phase | Monetization | Accounts |
|---|---|---|
| v1 launch (P0/P1) | Ads only (E1 as briefed) | None. Stateless, URL + localStorage |
| P2 (may slip to P3) | Add one-time paid reports (option B); optional email capture | None required; guest checkout |
| P3 (conditional) | Revisit subscription only if ad RPMs disappoint or the product pivots toward retention/identity | Accounts only if subscription is chosen |

Paid reports are scheduled for **P2** and are explicitly not a v1-launch blocker, so they may slip to P3 without holding anything up: v1 ships ads-only, and reports are purely additive on top of the stateless launch. The paid mobile app stays out of the roadmap until web traction proves demand.

---

## 6. Risks and the honest counter-case

- **Google dependency.** The main argument against ads-only. Option B's paid line is the primary hedge; affiliate and email (per `docs/ad-monetization-review.md`) are secondary hedges.
- **Astrology RPM softness.** Moderate, not high; the network staircase and session depth are the mitigations.
- **When to change this recommendation.** If ad RPMs come in weak, or if the owner decides to pivot Starcharts from casual-utility toward a retention/identity product (the Co-Star lane), then accounts plus subscription become the right engine, because subscriptions reward retention where ads reward one-off traffic. That is a real fork, but it is a different product than the one the plan describes today. As long as the positioning stays "casual, delightful, simple," ads-primary plus one-time reports is the model that fits.
