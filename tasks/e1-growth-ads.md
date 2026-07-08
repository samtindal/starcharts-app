# E1 — Growth & Ads

**Scope:** Monetization + share loops. Depends on C1 (events) and D1 (pages).

- AdSense slot map (final):
  - **Aspect/sign/planet pages** (where search traffic lands = where revenue lives): one in-article unit after the opening meaning section, one at the bottom before the footer links. Two max — these pages are short, and content-to-ad ratio matters for approval.
  - **Clock page**: one unit below the aspect table only. **Nothing on or near the wheel** — AdSense policy penalizes ads adjacent to interactive elements (accidental-click risk), and the clean wheel is the product and the share-screenshot.
  - Mobile anchor ads: decide after launch data; high RPM but cheapens the brand.
  - Every slot gets a fixed-height reserved container — layout shift (CLS) from late-loading ads damages Core Web Vitals, which damages rankings, which damages the traffic the ads feed on.
  - EU consent (CMP) loads before any ad script; no personalized ads without consent.
- OG image endpoint: chart-svg rendered server-side → PNG for any chart URL. Natal/synastry results get "share my chart" buttons.
- Analytics (privacy-light, e.g. Plausible + GA4): drag engagement, date-travel depth, aspect taps, share clicks, MCP referrals.
- Consent management platform for EU (required for AdSense).
- PWA install prompt after 2nd session.
