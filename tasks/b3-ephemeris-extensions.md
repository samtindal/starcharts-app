# B3 | Ephemeris Core: extensions

**Scope:** `packages/astro-core` (+ its `ephemeris.ts` re-export surface). Pure calc only, zero DOM. Extends B1; every downstream (web, MCP, OG) inherits these for free. All new numbers get astronomical-invariant tests (never snapshots), per CLAUDE.md.

Depends on: B1 (done). Blocks: C3 (needs Ascendant math + true-node exports), D3/D4 (need moon-phase + VoC).

Each item below is independently shippable; land them in roughly this order (correctness fixes first, new points last).

---

## 1. Sun/Moon true speed (correctness fix, do first)

**Bug:** `positionAt` sets `speed = MEAN_MOTION[point]` for the Sun and Moon instead of true daily motion. The Moon's real speed swings 11.8–15.3 °/day (perigee↔apogee) and the Sun's 0.95–1.02 °/day; feeding a constant into `BodyPosition.speed` makes the `applying`/`separating` flag in `matchPair` wrong for Moon and Sun aspects near the extremes, and understates fast-Moon drag hints.

**Fix:** in `positionAt`, use `dailyMotion(point, date)` for every body except the two nodes (nodes keep the analytic `NODE_RATE`). `dailyMotion` already central-differences `longitudeAt`, so this is a one-line change plus deleting the Sun/Moon special-case. `MEAN_MOTION` stays as the solver's step-scaling constant only (its documented purpose), do not delete it.

**Tests:**
- Moon speed at a known perigee is > 14.5 °/day and at a known apogee < 12.5 °/day (find via `astronomy-engine` `SearchLunarApsis`/`NextLunarApsis`; add to `ephemeris.ts`).
- Sun speed near perihelion (~Jan 3) > 1.01 °/day, near aphelion (~Jul 4) < 0.96 °/day.
- Regression: an `applying` case where mean-vs-true speed flips the flag (fast Moon separating that the old code called applying).

## 2. Luminary-weighted orbs

**Why:** fixed per-type orbs (8/5/7/7/8 regardless of bodies) read wrong to anyone who charts. Tradition gives the Sun and Moon the widest orbs; points other than the luminaries get tighter ones.

**Change:** replace the scalar `orb` on `ASPECT_TYPES` with a function. Keep `ASPECT_TYPES[t].angle` and add `ASPECT_TYPES[t].orb` as the **base/default** orb (unchanged values, so existing callers that read it still compile), plus a new exported:

```
orbFor(type: AspectType, a: PointName, b: PointName): number
```

Rule (moiety-style, casual-simple): base orb from the type, widened when a luminary is involved. Suggested table, luminary (`Sun`/`Moon`) present → +2° on conjunction/opposition, +1° on trine/square, +0° on sextile; nodes and outer-only pairs → base. Owner sign-off on exact numbers before merge; put the table in one place so it is tunable.

`matchPair` and `detectAspects`/`crossAspects` call `orbFor(type, pa.body, pb.body)` instead of `def.orb`. Content pages that print "within Nº" must read the same function (no hardcoded orb text). **Do not change the palette or which aspects count**, this only moves the cutoff.

**Tests:** a Sun–Moon pair at 9.5° from conjunction now matches (base 8 + 2), an equivalent Mercury–Saturn pair at 9.5° does not; sextile orb unchanged for luminaries.

## 3. True (osculating) node option, DROPPED 2026-07-12

**Owner decision 2026-07-12: this option was removed.** The nodes are always the Mean node; the mean-vs-true toggle was never surfaced in the UI and the true-node code path (`trueNodeLongitude`, the `nodeModel` param, and its §3 tests) has been deleted from `astro-core`. The section below is retained for history only.


**Why:** the casual audience is app-trained and Co-Star/CHANI/astro.com default to the **True Node**; mean-only guarantees "your site disagrees" threads. Keep mean as an honest, documented option but offer true.

**Approach (astronomy-engine only, no Swiss Ephemeris):** compute the osculating node from the Moon's instantaneous geocentric state. Get position + velocity via `GeoMoonState(date)` (returns a `StateVector`; add to `ephemeris.ts`). The orbital-plane normal is `r × v`; the ascending node direction is `ẑ_ecl × n` expressed in the ecliptic-of-date frame. Rotate the equatorial J2000 state into true-ecliptic-of-date first (reuse the same frame `longitudeAt` targets, factor a shared `toEclipticOfDate(vec, date)` helper so Moon longitude and the node use one code path). North-node longitude = `atan2` of that node direction; south = +180°. The osculating node wobbles up to ~1.75° around the mean, which is exactly the astro.com "true node" column.

**API:** add a `nodeModel: 'mean' | 'true'` option threaded through `longitudeAt` / `positionAt` / `chartAt` (default `'mean'` to preserve current behaviour and all existing tests). Do NOT branch in a dozen call sites, put the mean-vs-true switch inside the node branch of `longitudeAt`.

**Tests:**
- True north node stays within 1.75° of mean across a sampled year, and the two cross (difference changes sign) at least twice.
- South node exactly opposite north in both models (existing invariant, now parametrized).
- `detectAspects` still suppresses the degenerate NN–SN opposition in true mode.
- Regression against 3–4 astro.com true-node readings (record the reference values in the test as literals with a source comment).

## 4. Chiron | precomputed table, 1900–2100 (owner decided 2026-07-08)

**Constraint:** `astronomy-engine` has NO Chiron. It ships Sun–Pluto + Moon only. Chiron is a chaotic-orbit centaur; there is no clean analytic path, and Swiss Ephemeris is banned (CLAUDE.md). So Chiron is the one point that cannot come from the engine.

**Decision: ship it via a precomputed longitude table.** Chiron has crossed into mainstream casual vocabulary (the "wounded healer") in a way no asteroid has, so it earns its place for this audience; the table keeps it license-clean and offline. Generate Chiron tropical ecliptic longitude once from **JPL Horizons** (raw longitude numbers are not copyrightable, so redistribution is fine, no Swiss Ephemeris), sample **every 5 days over 1900–2100**, ship as a compact data file in `astro-core` (tens of KB), **cubic-interpolate** at runtime. Chiron moves ≤ ~50 arcmin/day, so 5-day cubic interpolation is far inside any orb. (Rejected: `GravitySimulator` from JPL state, heavier, chaotic-orbit accuracy risk, more code to trust, no casual upside. Rejected: dropping Chiron, the casual recognition is real.)

**Implementation:** add `Chiron` to a separate `EXTRA_POINTS` list (NOT `PLANETS`, so nothing that iterates planets silently changes), glyph ⚷ + `U+FE0E`, silver like the other bodies, drag rate ~1°/18 days. Retrograde badge: yes, flag it retrograde like the outer planets (derive from the interpolated longitude's local slope, same `dailyMotion` central-difference pattern). **Opt-in on the wheel, off by default** to keep the clock legible (owner "less is more" rule). Range-guard every consumer: outside 1900–2100, omit Chiron rather than extrapolate, it disappears, it never shows a wrong number. This is the single documented exception to the pure-astronomy-engine model; note it in the `astro-core` README so it doesn't read as an accident.

## 5. Moon phase API (feeds D4)

Expose current lunar phase from the engine so web/MCP share one source. Add:

```
moonPhase(date): { angle: number; name: PhaseName; illumination: number; nextNew: Date; nextFull: Date }
```

`angle` = Moon−Sun ecliptic longitude, [0,360); `name` from the 8 standard buckets (new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, last quarter, waning crescent) by 45° octants centered on the exact points; `illumination` 0–1 from `(1 − cos angle)/2` (or `astronomy-engine` `Illumination(Body.Moon)` for the physically exact value, prefer the latter, add to `ephemeris.ts`). `nextNew`/`nextFull` via `SearchMoonPhase` (already exported). Astrological, not astronomical-libration detail.

**Tests:** at a `SearchMoonPhase(0)` instant `name === 'new'` and illumination ≈ 0; at `SearchMoonPhase(180)`, `name === 'full'`, illumination ≈ 1; angle monotonic-mod-360 over a synodic month.

## 6. Void-of-course Moon (feeds D4)

Traditional + casual-beloved, purely computed, fits the "computed-data SEO" bet. The Moon is void-of-course from the moment it makes its **last exact Ptolemaic aspect to another of the ten bodies** (classical set; owner may restrict to the seven visible) until it **ingresses the next sign**.

```
voidOfCourse(date): { isVoid: boolean; since: Date | null; until: Date }
```

`until` = next Moon sign ingress (search Moon longitude crossing the next 30° multiple, reuse `dateForLongitude` or a forward scan). `since` = time of the Moon's last exact aspect before that ingress (scan backward/forward over the current sign transit, evaluate exact-aspect crossings to the other bodies using `separation(...) − angle` sign changes, take the last one at or before `until`). `isVoid` = `date ≥ since`. Document the aspect set used (owner decision: 10-body modern vs 7-body traditional) in a comment and in the D4 copy. Mean vs true node is irrelevant here (nodes are not bodies the Moon "aspects" for VoC).

**Tests:** pick a date, assert `since ≤ date < until`, `until` is an exact sign boundary (Moon `degreeInSign` ≈ 0 there), and no exact Moon aspect to the ten bodies occurs strictly between `since` and `until`.

## 7. Minor aspects | quincunx only, gated toggle (owner decided 2026-07-08)

**Decision: ship the quincunx (150°) only.** It is the one minor with real casual recognition, the one people actually ask about, and it does interpretive work the majors don't (the "awkward, needs adjustment" aspect). Semisextile, semisquare, and sesquiquadrate are practitioner-tier and would clutter the wheel for a 5-second-comprehension audience, leave them out of v1.

**Implementation:** add a `MINOR_ASPECT_TYPES` map holding just `quincunx: { angle: 150, orb: 2 }`, but keep the map shape extensible so the other three can be added later behind the same toggle if depth ever proves demand. `detectAspects(positions, { includeMinor })` merges it when asked; **default false**. Tight 2° orb keeps it visually rare.

**Palette (no new token):** the quincunx joins signs with no shared element or modality, so it reads as mildly hard, draw it in **`--hard` (steel blue) with a fine dash `1 4`** (tighter than the opposition's `8 5`) so it is unmistakably a minor and never competes with the five majors. Stays inside the sanctioned colors; **no new colors** (CLAUDE.md: never red/pink/purple/orange/yellow). Wheel renders it only when the toggle is on. Content pages for minors are out of scope here (D-row decides if/when).

## 8. Ascendant / MC math (feeds C3; math only, no UI, no houses)

Ships the rising sign without committing to Placidus. Add:

```
ascendantMC(date, latDeg, lonEastDeg): { ascendant: number; mc: number; ascSign: SignName; mcSign: SignName }
```

- Local Sidereal Time: `SiderealTime(date)` → GMST hours (add to `ephemeris.ts`); `LST = GMST + lonEast/15` (hours, mod 24). RAMC = `LST * 15` degrees.
- Obliquity ε of date from `astronomy-engine` (`e_tilt(time).tobl`, or derive; add to `ephemeris.ts`).
- MC (ecliptic longitude): `atan2(tan(RAMC)... )`, use the standard `MC = atan2(sin RAMC, cos RAMC · cos ε)`, resolved to the same hemisphere as RAMC.
- Ascendant: `Asc = atan2(cos RAMC, −(sin RAMC · cos ε + tan φ · sin ε))`, normalized to [0,360), quadrant-corrected so Asc is the rising (eastern) point.
- `ascSign` = `SIGNS[floor(asc/30)]`; likewise MC.

Whole Sign is the ONLY house model implied here: 1st house = whole `ascSign`, houses 2–12 follow in zodiacal order. Do NOT compute Placidus/Equal cusps (PLAN.md P3, still deferred). Ascendant is defined at every latitude (only Placidus breaks near the poles), so no polar fallback is needed for Whole Sign.

**Tests (launch blocker, astrologers audit this):**
- 3–4 known birth data (date + time + lat/lon) with astro.com's Ascendant and MC recorded as literals + source comment; assert within 0.5° (E2's stated accuracy bar).
- Asc and MC are ~90° apart in right ascension terms (sanity, not exact ecliptic 90°).
- Longitude-sign convention pinned by a test (east-positive): a known eastern-hemisphere birth resolves to the correct rising sign so nobody flips the sign later.

---

## 9. Aspect-importance scoring (owner promoted to P1 2026-07-08)

**Why:** the clock and every aspect list should lead with what matters, not with an arbitrary or purely orb-sorted order. A single pure score lets the UI highlight the day's top aspects and sort consistently, and is the foundation for later daily/personalized readings.

**API:** `aspectStrength(asp: Aspect, mode?: StrengthMode): number` (higher = more important; `mode` defaults to `'transit'`) and `rankAspects(asps, mode?): Aspect[]` (strongest first, pure, non-mutating). `StrengthMode = 'transit' | 'natal' | 'transit-to-natal' | 'synastry'`. Deterministic, no ML, no per-request cost.

**Shared base (all modes):** orb tightness is the DOMINANT factor (`1 - orb/orbFor(...)`, multiplies everything, so it reads the same cutoff as detection), times aspect-type weight (conjunction/opposition > square/trine > sextile), times luminary-weighted body weight (`POINT_WEIGHT`, Sun/Moon heaviest, nodes lightest). `orbFor` is reused so tightness and detection never diverge. All weights sit in one tunable block in `aspects.ts`.

**Mode terms:** `transit` adds applying-vs-separating and duration/rarity (fast Moon down-weighted, rare slow-slow boosted). `natal` is a static snapshot (no time terms) with a target-significance term ranking contacts with the lights highest. `transit-to-natal` keeps the time terms AND weights by the natal point being hit (`b`, per the `crossAspects` contract where `a` = transiting). `synastry` is static and weights cross-chart luminary contacts. Ascendant/angle aspects are not charted points in v1, so target-significance keys on the two luminaries (extend if angles become aspecting points later).

**Consumers:** the clock (`Wheel`) orders its table with `rankAspects` (transit) and emphasises the top 3 (brighter line + a gold rail on the row); planet pages use transit; the natal transit list uses `'transit-to-natal'`; the P2 synastry grid will use `'synastry'`; a natal-aspect list, if added, uses `'natal'`. Does NOT change `detectAspects`'s documented orb-ascending contract (existing tests untouched); ranking is a separate, opt-in call.

**Tests (invariants, not snapshots):** transit base, strictly decreasing in orb, applying ≥ separating, conjunction > sextile at equal orb/bodies, luminary pair > node pair, Moon down-weighted, slow-slow rarity boost (Saturn–Pluto > Saturn–Mars), `rankAspects` monotonic/complete/deterministic; plus per mode: natal ignores the applying flag and favours the lights, transit-to-natal weights by the natal target `b` and keeps the time terms, synastry is time-invariant and favours luminary contacts, and switching mode changes the score for a Moon aspect.

## `ephemeris.ts` additions (single point of contact | keep the CJS-interop wrapper)

Add re-exports, all through the existing `astronomy` namespace fallback: `SiderealTime`, `GeoMoonState`, `Illumination`, `SearchLunarApsis`/`NextLunarApsis`, `e_tilt` (or the obliquity accessor), and any rotation helpers used by the shared `toEclipticOfDate`. Never import `astronomy-engine` directly elsewhere (vitest/node interop differs, see the file header).

## MCP note (do not implement here; D2 is owner-PAUSED)

When D2 resumes, these extensions give it `nodeModel`, moon-phase, and VoC tools for free, and `ascendantMC` becomes the basis for the deferred `lat`/`lon` natal params. Leave a one-line TODO in `apps/mcp` pointing here; do not touch the paused server.

## Done when

New invariants green in `packages/astro-core/test/core.test.ts` (`npx vitest run`), existing 34 tests still pass unchanged (defaults preserved), no `astronomy-engine` direct imports added, no new colors, no em dashes in any string. Update this brief's status line and PLAN.md §5 orbs note on completion.

**Status 2026-07-08: DONE for P1 scope.** (Update 2026-07-12: §3 true-node option removed, Mean node only.) Shipped §1 (Sun/Moon true speed), §2 (`orbFor`), §5 (`moonPhase`), §6 (`voidOfCourse` + `VOC_BODIES`), §8 (`ascendantMC`/`wholeSignHouses`), §9 mode-aware (`aspectStrength(asp, mode)` for transit/natal/transit-to-natal/synastry + `rankAspects`), plus `signWindows` (for D3). Deferred to P2 per PLAN tiers: §4 Chiron table, §7 quincunx toggle. astro-core suite now 91 green (test/core.test.ts unchanged at 38; new invariants in test/b3.test.ts). No `astronomy-engine` direct imports outside `ephemeris.ts`; no new colors; no em dashes. Ascendant is validated by independent horizon invariants (rising point altitude ≈ 0 east, MC on the meridian); astro.com literal parity is left to E2's audit per C3.
