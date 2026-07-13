# Content Quality Bar: fully generated interpretation copy

**Date:** 2026-07-08 · **Owns the standard for:** D5 (`tasks/d5-content-depth.md`), D3 (`tasks/d3-planet-in-sign.md`)
**Engine:** `packages/astro-core/src/interpret.ts` (pure, shared) · **App entry:** `apps/web/lib/compose.ts` (re-export)
**Gate:** `packages/astro-core/test/interpret.test.ts` (47 tests green)

Decision (owner, 2026-07-08): **no hand-written per-page copy anywhere.** All interpretation text is generated, and it must be deep on its own. There is no "hand-written ceiling" for high-traffic pages; instead the generator itself produces depth by composing many independent dimensions. This doc is the executable standard: every example below is emitted by `interpret.ts` verbatim.

## Why the engine lives in astro-core

Interpretation text is now beside the numbers, for the same reason positions are shared: the web pages, the MCP server's plain-language summaries, and OG captions must never disagree. `interpret.ts` is pure (strings only, no DOM, no framework), so it drops into the existing astro-core test suite and the (paused) MCP server can reuse it later at zero cost. `apps/web/lib/compose.ts` is a thin re-export so page code imports locally.

## How depth is generated (not authored)

Each aspect page is five generated paragraphs, each chosen from several phrasings by a slug-seeded hash, so sections vary independently, neighbouring pages differ, and any page is byte-stable between renders:

1. **opener** what this aspect is, for this pair (3 templates per aspect type)
2. **energies** what each of the two points governs (3 templates)
3. **combination** how this aspect quality makes this pair interact (2 per type)
4. **balance** at its best / under strain, per pair (2 per band: soft / hard / conjunction)
5. **transit vs natal** passing weather vs a standing birth-chart trait (2 templates)

Every point carries a ten-field `Voice` (`noun`, `domain`, `gives`, `needs`, `shadow`, `verb`, `sphere`, `atBest`, `atWorst`, `name`), so sentences vary grammar and role rather than slotting one archetype phrase. That is what killed the old mad-libs teaser ("identity and vitality merges with mind and message").

## Aspect pages, verbatim from the engine

**Venus square Mars**
> Venus square Mars is friction with a purpose: the power of attraction and the will to act pull at right angles and press for a decision.
>
> Venus governs love, pleasure, and taste; Mars governs drive, courage, and appetite. Read the aspect as the working relationship between them.
>
> The square keeps them at cross purposes: Venus wants someone to draw close while Mars wants a target, until a choice is made. Handled well, that pressure is the engine that gets things done.
>
> Pushed in a good direction, it yields warmth that puts others at ease sharpened by courage that is well aimed. Pushed badly, it hardens into a taste for comfort that avoids the hard thing set against force for its own sake.
>
> Timing matters. When Venus forms this square to Mars in the sky, it is a temporary weather system that comes and goes. Held in a natal chart, it describes something the person carries for life.

**Sun conjunction Moon**
> When the Sun and the Moon meet at the same point of the wheel, warmth and purpose fuses with tenderness and memory, for better and for worse.
>
> The Sun governs selfhood, confidence, and creative vitality; the Moon governs emotion, habit, and the need to belong. Read the aspect as the working relationship between them.
>
> Because they share a degree, you rarely feel one without the other: warmth and purpose, together with tenderness and memory, arrives as a single impulse, and it takes deliberate effort to separate them.
>
> As one force it is potent either way: a steady, generous sense of who you are joined to a nourishing, honest emotional instinct when it is owned, or pride that has to be the center feeding moods that rule the day when it is not.
>
> Timing matters. When the Moon forms this conjunction to the Sun in the sky, it is a temporary weather system that comes and goes. Held in a natal chart, it describes something the person carries for life.

**Saturn opposition Moon** (note the reading shifts to projection/axis, correct for an opposition)
> The opposition strings Saturn and the Moon along one axis, so each tends to be met out in the world, in other people, rather than owned within.
>
> Saturn governs work, time, and responsibility; the Moon governs emotion, habit, and the need to belong. Read the aspect as the working relationship between them.
>
> Across this divide, a rule to keep and shelter look like opposites, and the pull is to pick a side. The real work is holding both, since each carries half of the truth.
>
> At its best the friction produces patience that builds something lasting tempered by a nourishing, honest emotional instinct. Under strain it slides toward fear that hardens into a wall colliding with moods that rule the day, the same energy turned against itself.
>
> As a transit, the Moon moving to opposition Saturn marks a passing window, hours to days for the Moon, months or years for the slow outer bodies, when the theme is live. In a birth chart the same aspect is a standing feature of character.

Node pairs drop the best/strain paragraph (four paragraphs, not five), because "at its worst" reads forced for a point rather than a body. That is a deliberate honesty rule, not a gap.

## Planet-in-sign pages, verbatim

**Mars in Scorpio**
> With Mars in Scorpio, the will to act takes on a feeling, instinctive, tidal key. Being fixed, it digs in, holds its position, and resists being moved.
>
> In Scorpio, expect drive, courage, and appetite to feel deep and receptive and distinctly persistent. The planet keeps its nature; the sign sets the style.
>
> Well integrated, it looks like courage that is well aimed in a Scorpio register; strained, it slides toward force for its own sake.

Element and modality are derived from the sign's zodiac position (`elementOf` / `modalityOf`), so the engine never re-derives or contradicts them.

## Sign and planet pages, verbatim (D5, added 2026-07-13)

The same clause-bank model extends to the 12 sign and 12 planet/point pages, which previously carried only a lede and one `SIGN_INFO`/`PLANET_BLURB` sentence.

**Aries** (`composeSignParagraphs`)
> Aries is the cardinal fire sign, belonging to the positive, outward-turned half of the zodiac: a fast, outward, expressive key. Being cardinal, it wants to start things and set them moving.
>
> The tropical zodiac keys Aries to the turning year: it opens spring at the March equinox, the zodiac’s new year. Its traditional ruler is Mars, the planet of drive suits the sign that charges first. In the old body-map the sign governs the head.
>
> At its best Aries offers the nerve to begin. Under strain the same nature can become a fuse that burns too fast.

**Saturn** (`composePlanetParagraphs`)
> In the traditional scheme Saturn carries work, time, and responsibility. It builds and restrains wherever there is structure, time, and discipline; what it offers is patience and backbone, what it looks for is a rule to keep, and its failure mode is coldness.
>
> Saturn spends about two and a half years in each sign, twenty-nine years for the circuit. It spends about four and a half months of each year retrograde.
>
> Read well, Saturn shows as patience that builds something lasting. Read badly, it slides toward fear that hardens into a wall.

The ruler named in sign copy always resolves through `SIGN_TRADITION` (astro-core), the same table `TRADITIONAL_RULER`/`rulerDisplay` use on the web side, so a sign page and its ruler's planet page can never name a different ruler for each other.

## The rest of the page = generated copy + computed spine

The generated prose is the whole interpretive body. A shipped page still wraps it with the **computed spine** (no prose): live position/aspect status, the past→next exact-date timeline from `nextExactAspectDates`/`lastExactAspectDate`, the server-rendered aspect-strength-over-time SVG from `aspectStrengthTimeline` (D5, sampled once per daily ISR cycle), orb text from `orbFor`, and the embedded live wheel pre-scrubbed to the next event. That spine is the SEO-defensible, AI-Overview-resistant layer no prose-only competitor can generate.

## The gate (regression test)

`interpret.test.ts` enforces the bar so quality cannot silently regress:

- all 325 aspect openers are unique (no two pages share a teaser);
- each aspect type draws on more than one opener template (catches accidental collapse to one string);
- every aspect page is 5 paragraphs (4 for node pairs) and over 400 characters;
- every paragraph is clean prose: no em dash, no double space, ends in a period;
- all 144 planet-in-sign texts are unique and at least 3 paragraphs;
- all 12 sign texts and all 12 planet/point texts are unique, 3 paragraphs, clean, and deterministic (D5);
- output is deterministic (same input, same bytes).

`timeline.test.ts` (D5) gates the computed-spine graph separately: the strength curve peaks at the known exact instant, is zero at both window edges, and the window scales to how fast the pair moves (days for the Moon, longer for slow outer-planet pairs).

To widen variety later, add phrasings to `OPENERS` / `ENERGIES` / `COMBINATION` / `BALANCE` / `TRANSIT_NATAL` / `SIGN_CORE` / `SIGN_TRAD` / `SIGN_BALANCE` / `PLANET_ARCH` / `PLANET_PACE` / `PLANET_BALANCE` or enrich a `Voice`; `pick()` uses them automatically and the tests keep it honest.

## Sources (interpretation grounding)

Significations follow standard references, not invented meaning:

- [Cafe Astrology: The Meaning of the Aspects](https://cafeastrology.com/articles/aspectsinastrology.html)
- [Cafe Astrology: Planets in Astrology](https://cafeastrology.com/articles/planetsinastrology.html)
- [TimePassages: The Aspects](https://www.astrograph.com/learning-astrology/aspects.php)
- [Labyrinthos: Astrology Planets and Their Meanings](https://labyrinthos.co/blogs/astrology-horoscope-zodiac-signs/astrology-planets-and-their-meanings-planet-symbols-and-cheat-sheet)
- [Wikipedia: Astrological aspect](https://en.wikipedia.org/wiki/Astrological_aspect) · [Wikipedia: Planets in astrology](https://en.wikipedia.org/wiki/Planets_in_astrology)
