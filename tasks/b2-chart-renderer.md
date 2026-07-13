# B2 | Chart Renderer

**Scope:** `packages/chart-svg`, pure `ChartState → SVG`. No event handling (that's C1).

- Layers (separate `<g>`, in order): vignette bg → zodiac ring + sign glyphs → degree ticks (sextant style) → aspect lines → planet glyphs → retrograde markers → "now" marker.
- Theme via CSS custom properties only (PLAN.md §5). Compass-rose/astrolabe framing: double ring, fine ticks every 1°, bold every 10°, faint rhumb cross in center.
- Coordinate convention (match prototype): Aries 0° at left (9 o'clock), longitudes increase counterclockwise. `angle = (180 − lon)°`, y-down SVG.
- Planet glyph collision: nudge radially inward when two bodies within 6°.
- Must render server-side (string output) for OG images, no `document` references.
- Fixture page with 4 states: today, tight stellium, grand trine, natal overlay.

**Port from `prototype/index.html`:** geometry helpers, tick generation, aspect-line styling. Improve, don't import.
