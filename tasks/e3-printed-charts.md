# E3 | Commerce: printable chart PDF

**Scope:** Sell a downloadable, print-ready PDF of the user's chart wheel: the nautical astrolabe rendered at print resolution and delivered as a digital file the buyer prints themselves (home, a print shop, or a POD site of their own choosing). This is the "keepsake" monetization lever alongside the digital interpretation reports (PLAN.md §6): the report sells the interpretation, the chart PDF sells the artifact. The chart is already the most screenshot-worthy thing in the market (competitive-strategy §2); this turns that into a wall-art file, with none of the shipping, inventory, or physical-tax overhead of a print-on-demand product.

Depends on: B2 / `chart-svg` (print-resolution render), C2 + C3 (natal chart state: the compelling product is *your* natal wheel, so it needs the birthdate/time/place inputs those ship), and the P2 paid-reports checkout (shared Merchant-of-Record digital checkout, ToS/Privacy/Refund policies, entertainment-and-reflection framing). Blocks: nothing. Runs after the paid-reports lever exists so it reuses that checkout and PDF-delivery pipeline rather than standing up a second one.

**Why:** ads and interpretation reports both monetize attention and text; neither captures the identity-invested user who just wants a beautiful chart to frame. A print-ready chart PDF has a natural gift use case, near-zero marginal cost (pure compute, no inventory, no fulfillment, no shipping), and rides the one asset no incumbent has: a chart that actually looks good. Because it is a digital file, it folds cleanly into the same stateless, Merchant-of-Record model as reports, with no new tax, shipping, or PII surface.

## What ships

- A **"Download as a print"** affordance on the natal chart surface (`/chart`, and optionally the share/OG view). Subordinate to the toy and the free chart; never gates them. Opens a small configurator: paper size and colorway.
- **Print-resolution render.** `chart-svg` already emits a pure SVG string from a `ChartState` and doubles as the OG renderer; the deliverable is the same renderer at a poster aspect ratio and print DPI, exported to a print-ready **PDF** server-side on Cloud Run (vector-first, so the linework stays crisp at any size the buyer prints). No second renderer, no hardcoded colors: the print pipeline reads the same theme tokens (PLAN.md §5).
- **Personalization.** The file carries the person's name, birth date, and location as an engraved caption under the wheel, plus the Big Three, all from the existing natal state. Glyphs keep U+FE0E (monochrome text glyphs, never emoji) so they render as clean linework at size, and the ☉ optical-size bump still applies.
- **Checkout and delivery.** Config goes through the reports' Merchant-of-Record checkout as a digital good; delivery by download link or emailed link, guest checkout, no account, exactly like reports. The file regenerates deterministically from the pinned engine version, so we store birth inputs and product type, not the rendered file (caching the PDF behind a signed URL is an optimization only).

## Why digital-only keeps it simple

Selling a file, not a shipped object, means the whole physical-commerce surface disappears: no print-on-demand vendor, no inventory, no shipping cost or address, no customs/duties, no physical returns policy. It bills through the same **Merchant of Record** as reports (Paddle / Lemon Squeezy), which remits global sales tax/VAT and absorbs PCI, so there is no separate tax path and no new nexus question. The buyer handles their own printing, which also sidesteps press-proofing: we ship a correct high-resolution file and let them choose paper and printer.

## Print correctness notes (so the file prints well)

- Export vector-first **PDF**; if a raster fallback is ever needed, render at a high enough DPI for large paper (aim for the file to look crisp at common poster sizes).
- The screen palette is dark navy (`--bg` #0A1628) with silver/gold linework. A full-bleed dark file is ink-heavy on a home printer and can band; convert the screen tokens to a print color space (CMYK/ICC) rather than embedding raw sRGB hex, and note in the product copy that dark prints look best from a good printer or a print shop. No new colors: any adjustment stays within the sanctioned tokens.
- Offer at most one alternate colorway, a light **parchment** ground (`--parchment` #E8DCC4) with the same linework, which prints cleaner on home printers and is already a theme token. No red, pink, purple, orange, or yellow, in either colorway (owner palette rule).
- Set a print **bleed and safe margin** and target standard paper ratios/sizes so the buyer can print without cropping the wheel.
- The wheel that goes to the PDF is the same math as the site: source the `ChartState` from astro-core, never recompute positions in the print path (single source of truth, CLAUDE.md).

## Legal / brand guardrails (reuse the reports foundation)

- Same entertainment-and-reflection framing as reports; the product is art and a keepsake, never prediction of fact, so it stays clear of fortune-telling-for-payment statutes and AdSense sensitivity (PLAN.md §7).
- Reuse the published ToS/Privacy/Refund policies and the EU/UK immediate-delivery consent + withdrawal-right waiver already built for digital reports (this is a digital good, so that same waiver applies).
- Birth inputs are sensitive PII: minimize retention (stateless regeneration), same handling as reports; no shipping address is collected at all.

## Done when

A user with a natal chart can configure a print-ready PDF (paper size, colorway), buy it as a guest through the reports' Merchant-of-Record checkout, and download it; the PDF is generated by `chart-svg` at print resolution from the pinned-engine `ChartState` with no hardcoded colors and U+FE0E glyphs, vector-first with correct bleed/margins; delivery and data handling reuse the reports pipeline (no shipping, no physical tax path); palette-clean (navy/silver/gold or parchment only), no em dashes. Pricing set for a digital keepsake. Update status line.
