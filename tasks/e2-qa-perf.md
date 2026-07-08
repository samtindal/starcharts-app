# E2 — QA & Performance (launch gate)

- **Accuracy audit:** chartAt() vs astro.com Swiss Ephemeris output for 12 spread dates (1900–2100), all 10 bodies, tolerance 0.1°. Launch blocker.
- Solver: correctness through Mercury retrograde loops (drag across a station must not jump eras); fuzz targetLon × date.
- Perf: drag ≥30fps on mid-tier Android (throttled CPU×4 in devtools as proxy); Lighthouse mobile ≥90 on home + content pages.
- Cross-browser pointer events: iOS Safari, Android Chrome, desktop trio.
- PWA: installable, offline shell renders current chart from cached engine.
- MCP: schema validation, rate-limit behavior, key auth, response parity with astro-core.
