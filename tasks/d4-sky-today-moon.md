# D4 | Sky Today: moon phase & void-of-course

**Scope:** Turn the daily "sky today" surface into a casual daily-return habit by surfacing the two things the casual audience loves most and the build doesn't show: **current moon phase/sign** and **void-of-course Moon**. Display + content only; the math lives in B3.

Depends on: B3 §5 (`moonPhase`) and B3 §6 (`voidOfCourse`). Blocks: nothing. Parallel to C3/D3.

**Why:** moon phase and moon sign are the highest-affinity casual astrology content and a natural PWA re-engagement loop (people check the Moon daily). Void-of-course is tradition-beloved, purely computed, and exactly the AI-Overview-resistant computed-data play from competitive-strategy Bet 4 ("own 'the sky right now'"). Both already fall out of the engine once B3 lands; this brief is the surface.

## Where it goes

- The daily "sky today" page (D1's freshness surface) gets a **Moon panel** above or beside the wheel: current phase glyph + name, illumination %, Moon's sign and degree (link to `/planets/moon/{sign}` once D3 ships), next New and next Full dates. Phase rendered as a real waxing/waning graphic (SVG arc mask), silver on navy per palette, no third-party moon image, no new colors.
- A **void-of-course line**: when the Moon is void, "The Moon is void of course until it enters {nextSign} at {time} UTC" with the `since` time available on hover/expand; when not void, "The Moon is active in {sign}; next void begins {since}." Plain language, tradition-framed, no fate-for-payment claims (PLAN.md §7).
- Optional small **home/clock affordance**: a compact phase glyph near the dateline that deep-links to the sky-today Moon panel. Keep it subordinate to the drag, the toy is the moat; do not crowd the wheel.

## Content / SEO

- `/moon` (or `/sky/moon`) evergreen page: current phase + VoC + short tradition-framed explainer of what void-of-course means. Targets "is the moon void right now", "current moon phase astrology", "moon sign today", recurring, computed, thin-competition-per-day.
- A rolling **VoC calendar** (this month's void periods as a table, computed from `voidOfCourse` iterated across the month) is a strong computed-data page competitors keep stale; build it if cheap, else flag as a fast follow.
- Times shown in UTC (site convention, `fmtUTC`/`fmtDay` from `lib/content.ts`); a later nicety is "in your timezone" client-side, out of scope here.

## Correctness notes (defer to B3, don't reimplement)

- Use `moonPhase().name`/`illumination` and `voidOfCourse()` verbatim; do NOT recompute phase from Sun/Moon longitudes in the component (single source of truth = astro-core, CLAUDE.md).
- The VoC aspect set (10-body modern vs 7-body traditional) is B3's owner-decided constant; display copy must state which convention is used so the numbers are defensible ("based on the Moon's last major aspect to the traditional seven / the ten bodies").
- Live values are client-computed so they never go stale between ISR revalidations (same pattern as `LiveAspectStatus`).

## Done when

Sky-today shows current phase (graphic + name + illumination + Moon sign/degree + next new/full) and an accurate void-of-course status with `since`/`until`; `/moon` explainer live; all values sourced from B3 functions; times via existing UTC formatters; palette-clean (silver/navy/gold only), no em dashes. Update status line.
