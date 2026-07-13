# C1 | Drag ↔ Time Interaction

**Scope:** Pointer-event drag on planet glyphs → date changes via `dateForLongitude` (astro-core).

- Pointer events (not mouse/touch) with `setPointerCapture`; hit targets ≥44px.
- Per-frame: pointer angle → target longitude → solver (seed = last frame's date: converges in 2-3 iterations) → update timestamp → re-render. Budget: 60fps desktop, ≥30fps mid-tier Android.
- Retrograde handling: prefer time-continuity when multiple solutions (see PLAN.md §4); show ℞ glyph.
- Keyboard a11y: planet focusable, ←/→ step time by planet-scaled increments, Shift for ×10.
- Date readout always visible; "Now" reset button; clamp navigation to years 1000–3000 CE.
- Emit analytics events: dragStart/dragEnd (planet, date delta) for E1.

**Validated in prototype/index.html**, port the solver-seeding and angle math, add capture/a11y/perf work.
