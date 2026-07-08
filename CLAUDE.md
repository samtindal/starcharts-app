# Starcharts — Agent Conventions

The product name is **Starcharts** (working repo: astrology-clock). Use "Starcharts" in all user-facing copy, titles, and metadata.

Read PLAN.md first. Task briefs live in `tasks/<id>-*.md`; claim yours, respect the dependency graph in PLAN.md §3. Current build status lives in `tasks/README.md`. Market strategy: `docs/competitive-strategy.md`.

## Product decisions (owner-set, do not relitigate)

- **Audience: casual astrology consumers.** No houses/house systems in v1 (deferred, PLAN.md P3). Aspects are the focus.
- **Palette:** signs gold, planets/nodes silver, soft aspects verdigris, hard aspects steel blue. **Never red, pink, purple, orange, or yellow.**
- **Symbols:** real Unicode glyphs + U+FE0E (never emoji rendering); ☉ needs per-glyph size bump.
- On the clock page, aspect-table rows link ONLY to aspect pages; planet links live inside content pages only. Planet glyphs on the wheel: draggable, with hover tooltips (position + drag hint) that MUST disappear on drag start — but never clickable.
- Aspect teaser text must be unique per planet pair.
- **No em dashes (—) in any user-facing copy** (owner rule). Rewrite with commas, colons, or periods. En dashes in numeric ranges (Mar 21 – Apr 19) are fine. Titles use "|" as separator.

## Structure

- `packages/astro-core` — pure TS calculation engine. **Zero DOM/framework deps.** Everything (web, MCP, OG images) imports from here. If web and MCP could ever disagree on a number, the code belongs here.
- `packages/chart-svg` — SVG renderer + theme tokens (PLAN.md §5). Pure functions: `ChartState` in, SVG string/element out.
- `apps/web` — Next.js App Router + PWA. Wheel = client component; content pages = server components.
- `apps/mcp` — MCP server, streamable-HTTP transport. Thin wrapper over astro-core.
- `prototype/` — throwaway spike validating drag↔date. Do not import from it; port learnings into packages.

## Rules

- Ephemeris: `astronomy-engine` only. **Never add Swiss Ephemeris** (swisseph/sweph — AGPL/commercial) even transitively.
- Single source of truth for chart state = one UTC timestamp (plus natal timestamps in overlay modes). No duplicated derived state.
- Longitudes: tropical, geocentric, true ecliptic of date, degrees [0, 360). Aries 0 = 0.
- Angles helper functions (`norm360`, `wrapDiff`) come from astro-core; don't reimplement.
- Tests: vitest. Position code must test against astronomical invariants (equinox Sun = 0°, full-moon opposition), not snapshots.
- Theme: only CSS custom properties from PLAN.md §5. No hardcoded colors in components.

## Commands

- `npm install` (root, installs all workspaces)
- `npm test` (all workspaces)
- `npx vitest run` inside a package for focused runs
