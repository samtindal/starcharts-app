# C3 | Rising Sign & birth-data location

**Scope:** The "Big Three" (Sun, Moon, Rising) for the casual audience: birth date + time + place → rising sign, without Placidus. Input UI + a Whole Sign ring in natal mode. Sits on top of B3's `ascendantMC`.

Depends on: B3 §8 (`ascendantMC`), C2's natal plumbing (natal math already in astro-core). Blocks: nothing (P2 synastry can reuse the location field later).

**Why this exists / positioning:** rising sign is the single most-asked casual astrology question, every app leads with the Big Three, yet the current build defers ALL of it under "houses" (PLAN.md P3). This brief pulls **rising sign only** forward to P1. Full house systems (Placidus/Equal, `/houses/1..12`) stay deferred; the wheel stays house-free except for an optional Whole Sign ring in natal mode. If it can't be understood in 5 seconds, it doesn't ship here.

---

## The hard part: local birth time → UTC

The engine works in UTC. A birth time is given in **local civil time at the birthplace**, so we must convert, and that needs the historical timezone offset for that place on that date (DST, wartime zones, zone redefinitions). This is the notorious failure mode of natal tools, get it wrong and the Ascendant is off by an hour, i.e. a whole sign. Therefore the place lookup must return **lat, lon, AND an IANA timezone id**, and the local→UTC step must apply the offset that was in force on the birth date, not today's.

- **Timezone resolution:** use the IANA id from the place record + a date-aware conversion. `Temporal` (or Luxon `DateTime.fromObject({...}, { zone })`) applies the correct historical offset from the tz database for the given instant. Do NOT use the browser's local zone or a fixed offset. IANA/tzdata covers post-1970 rules well and pre-1970 approximately; surface a quiet caveat for very old or zone-ambiguous births.
- **Unknown birth time:** keep C2's existing "noon assumed" behaviour, but when time is unknown, **suppress the Ascendant entirely** (rising sign is meaningless without a time) and say so plainly. Do not show a noon-derived rising sign as if it were real.
- **Ambiguous/skipped local times** (DST spring-forward gap, fall-back overlap): pick the standard-time interpretation and note it; never throw.

## Place search (geocoding) | offline dataset preferred

Owner chose city/place search over raw lat/lon entry. Constraints: license-clean, no per-request cost, returns tz.

- **Recommended:** bundle a trimmed **GeoNames** cities dataset (e.g. `cities15000` or `cities5000`, CC-BY 4.0, attribution required in the footer/credits) shipped as a compact indexed JSON/typed-array in the web app (not in astro-core, this is app data, not calc). Each record: name, admin/country, lat, lon, IANA tz. Client-side type-ahead search (prefix + fuzzy), no network call, works offline/PWA. `cities15000` is ~25k rows and compresses small; pick the smallest tier that still finds the towns users type. Include a "can't find it?" manual lat/lon + tz fallback.
- **Alternative (if dataset size is a problem):** an API (Nominatim/OSM, honor the usage policy and add attribution; or a paid geocoder). Adds a runtime dependency and a network hop; PWA offline story degrades. Only if the bundled dataset is rejected on size.
- Persist the last-used place + birth data in `localStorage` ("my birth data" convenience, no accounts, matches C2). URL-serialize it too so Big-Three results are shareable (E1's share loops): encode `lat`, `lon`, `tz`, birth instant. Round lat/lon in the URL to ~2 dp (privacy + tidy links); keep full precision only in memory.

## UI

- **Birth-data form** extends C2's birthdate form: date, time (with an explicit "time unknown" switch), and the place type-ahead. One panel, progressive: place first, then the Big Three appear.
- **Big Three panel** (the payoff): Sun sign, Moon sign, Rising sign as three large glyphs (gold signs, silver planet glyphs per palette) with one-line plain-language captions pulled from `SIGN_INFO`/`ARCHETYPE`. This is the screenshot/share unit, make it OG-image-ready (hand to E1). Rising caption explains what a rising sign is in one sentence (tradition-framed, no fate-for-payment language, ad-policy per PLAN.md §7).
- **Whole Sign ring (natal mode only):** when a valid Ascendant exists, draw a thin house-number ring (1–12) starting at `ascSign`, numerals in `--line`/`--parchment`, faint, it must not fight the zodiac ring or aspect lines. 1st house = whole rising sign. Off in the default live-clock (transit) mode; the clock stays house-free. This is the ONLY house rendering allowed in v1 (Placidus/Equal remain P3). Reuse B2/Wheel geometry; do not re-derive angle helpers (`norm360`/`wrapDiff` come from astro-core, CLAUDE.md).
- Planet glyphs stay **drag-only** on the clock (no click/tooltip there); the natal ring's house numbers may carry hover tooltips ("1st house: self, body, the rising") like signs do, but the owner's clock-page linking rules are unchanged (aspect rows → aspect pages only).

## Content / SEO hooks (coordinate with D-row, don't duplicate)

- A `/rising` explainer page ("what is a rising sign / ascendant"), high-volume casual query, tradition-framed. Links to the tool.
- Rising-sign-in-sign is a natural 12-page family ("Leo rising meaning"); flag to D3 as an extension of its planet-in-sign system rather than building copy here.

## Accuracy (launch blocker)

The Ascendant is what astrologers spot-check first. Beyond B3's `ascendantMC` unit tests, C3 owns the **end-to-end** check: a known birth (date, local time, city) entered through the form must yield the same rising sign and Ascendant degree (±0.5°, E2's bar) as astro.com, this proves the timezone conversion, not just the math. Add 2–3 such cases to E2's audit list, spanning hemispheres and a DST-era birth. A single viral "off by a sign" screenshot kills the segment (competitive-strategy §4).

## Explicitly out of scope

Placidus/Equal/other house systems; `/houses/1..12` pages; house cusps beyond Whole Sign; MC-as-house-cusp geometry; relocation/solar-return charts. All P3 or later.

## Done when

Enter a birth date/time/city → correct Big Three incl. rising; "time unknown" hides the Ascendant gracefully; Whole Sign ring toggles with natal mode and never clutters the clock; state persists (localStorage) and shares (URL); GeoNames attribution present; end-to-end astro.com parity case green; no hardcoded colors, no em dashes. Update status line + the PLAN.md P1/P3 rows this brief changes.
