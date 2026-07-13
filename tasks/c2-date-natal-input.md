# C2 | Date & Natal Input

**Scope:** Forms + overlay modes on top of B1/B2.

- Date/time input → chart for that instant (URL-encoded: `/chart/2026-07-07T12:00Z`).
- Birthdate (+ optional time; note "noon assumed" when absent) → natal positions as fixed outer ring; transiting-to-natal aspects listed and drawn in distinct style.
- Synastry: second birthdate → chart A inner, chart B outer, inter-aspect grid table below.
- All state URL-serializable (share links are E1's fuel). No accounts; localStorage for "my birth data" convenience.
- Natal/synastry math goes in astro-core (`natalChart`, `transitAspects`, `synastry`), ✅ done, in package with tests. UI remains.
- **House systems: DEFERRED to post-launch (owner: "less is more").** Do not render houses in v1. The retained plan for later: birth location input (lat/lon + place-name lookup) → Ascendant/MC + cusps for Whole Sign, Equal, Placidus; selector persisted; math in astro-core (`houses(birth, lat, lon, system)`) tested against published cusp tables; Placidus polar fallback to Whole Sign; house ring only in natal mode; `/houses/1..12` pages with tooltips/links like signs; MCP natal tools gain `lat`/`lon`/`houseSystem` params. See PLAN.md P3 row.
