# Agent Task Briefs

One file per agent. Status (as of 2026-07-07): A1 ✅ · B1 ✅ (astro-core, 34 tests, incl. lunar nodes) · B2/C1 ⚙️ spiked in `prototype/` (drag, tooltips, clickable signs/aspects, legend, unique per-pair teasers) · C2 ⚙️ core math done (natal/transits/synastry in astro-core; UI pending; houses DEFERRED per PLAN P3) · D2 ✅ built, then **PAUSED by owner 2026-07-07** (apps/mcp works, 6 tools verified; precompute/monetization/registry listings all on hold — don't resume without asking) · F1 ✅ (Terraform + CI, not yet applied) · R1 ✅ (docs/competitive-strategy.md) · B2/C1/D1 ✅ shipped in apps/web (Next.js 15: React wheel with drag/tooltips/legend, 358-URL sitemap — 325 aspect-pair pages with computed next-exact dates via on-demand ISR, 12 sign + 12 planet pages, hubs, robots, PWA manifest; production build + smoke tests green 2026-07-07) · E1/E2 pending. **Next up: web Dockerfile + deploy (F1 phase 2), then E1 ads/analytics and E2 QA.** Notes: date-input UI is minimal (native datetime-local); natal/synastry UI (C2) still pending; webpack needs the extensionAlias trick in next.config.mjs for astro-core's .js→.ts imports.

Note for all agents: import ephemeris symbols from `astro-core/src/ephemeris.ts`, never from `astronomy-engine` directly (CJS/ESM interop differs between vitest and node/tsx).

| ID | File | Depends on |
|---|---|---|
| A1 | a1-architect.md | — |
| B1 | b1-ephemeris-core.md | A1 |
| B2 | b2-chart-renderer.md | A1 |
| C1 | c1-drag-time.md | B1, B2 |
| C2 | c2-date-natal-input.md | B1, B2 |
| D1 | d1-content-seo.md | B1 |
| D2 | d2-mcp-server.md | B1 |
| E1 | e1-growth-ads.md | C1, D1 |
| E2 | e2-qa-perf.md | C1, C2, D2 |
