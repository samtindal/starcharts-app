# B1 | Ephemeris Core ✅

**Scope:** `packages/astro-core`, the shared calculation engine.

**Interfaces (stable, other agents depend on these):**
- `longitudeAt(planet, date)` → tropical geocentric longitude, true ecliptic of date, [0,360)
- `isRetrograde(planet, date)` → boolean (Sun/Moon always false)
- `chartAt(date)` → `BodyPosition[]` (lon, sign, degreeInSign, retrograde)
- `detectAspects(positions)` → `Aspect[]` (conjunction/sextile/square/trine/opposition, per-aspect orbs)
- `dateForLongitude(planet, targetLon, near)` → nearest-in-time Date (the drag inverse solver)
- helpers: `norm360`, `wrapDiff`, `SIGNS`, `PLANETS`, `ASPECT_TYPES`

**Acceptance criteria (all in test/core.test.ts):**
- Sun longitude = 0/90/180/270 (±0.05°) at Seasons() equinox/solstice instants, proves of-date frame
- Moon−Sun separation = 180° (±0.1°) at SearchMoonPhase(180) instant
- Sun/Moon never flagged retrograde across sampled dates
- Synthetic aspect-detection cases incl. 0°/360° wraparound
- Solver round-trips: `dateForLongitude(p, longitudeAt(p, t), near≈t) ≈ t` for fast and slow planets
