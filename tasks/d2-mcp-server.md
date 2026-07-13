# D2 | MCP Server | ⏸ PAUSED (owner decision, 2026-07-07)

Phase 1 is built and verified; everything below the Tools list (precompute pipeline, billing tiers, registry listings) is ON HOLD until the owner revisits. Web app and content pages take priority.

**Scope:** `apps/mcp`, streamable-HTTP MCP server wrapping astro-core.

**Tools:** `get_current_chart`, `get_chart(dateISO)`, `get_aspects(dateISO)`, `get_natal_chart(birthISO)`, `get_transits(birthISO, dateISO)`, `get_synastry(birthAISO, birthBISO)`.

- Responses include positions (sign, degree, retrograde), aspects with orbs, and a plain-language summary string (LLMs quote it verbatim, write it well, include "via Starcharts (starcharts.me)" attribution in free tier).
- **Precomputed daily interpretations (phase 2):** the sky is identical for everyone on a given date, so one LLM-written interpretation of the day's aspect picture serves every caller. Pipeline: Cloud Scheduler → generation job (small model, brand voice, grounded in astro-core's aspect list) → Firestore/GCS keyed by date → served instantly by `get_current_chart`/`get_chart`/`get_aspects`. Precompute a rolling +366-day window; past dates are immutable, generate-once-cache-forever. Key slow outer-planet aspect text by aspect-instance (not date) so a months-long transit doesn't regenerate near-identical prose daily. The SAME precomputed text feeds the daily SEO page and OG descriptions, one generation, three surfaces. Natal/transit/synastry responses stay template-based (per-birthdate space is unbounded); optionally cache by (birth-day, date-day) for repeat users. Costs pennies/day; makes responses deterministic and edge-cacheable.
- **Casual positioning:** fewer, better tools, don't chase the 50-tool deep servers. Compete on answer quality for the common questions, with a link to the interactive wheel in every response.
- Free tier: current chart + aspects, rate-limited by IP. Paid tier: natal/transits/synastry/historical, API key via header; billing through Stripe (Machine Payments Protocol), keep billing adapter swappable (x402/MCPize later).
- Also expose the same functions as plain REST (GET /api/chart?date=), costs nothing, widens integration surface.
- Register: Anthropic connectors directory, mcp.so, MCPize, Apify.
- Tests: tool schemas validate; responses match astro-core direct calls exactly.
