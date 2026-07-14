/**
 * Interpretation copy for content pages.
 *
 * The engine moved into astro-core (`interpret.ts`) so the web pages, the MCP
 * server's plain-language summaries, and OG captions all draw from one source
 * and can never disagree, the same rule the numbers already follow. This file
 * is the app-side entry point; import interpretation helpers from here.
 *
 * Fully generated, no hand-written per-page copy. See docs/content-quality-bar.md.
 */
export {
  VOICES,
  composeAspectParagraphs,
  composeAspectTeaser,
  composePlanetInSignParagraphs,
  composePlanetInSignTeaser,
  composeSignParagraphs,
  composePlanetParagraphs,
  elementOf,
  modalityOf,
} from '@starcharts/astro-core';
export type { Voice } from '@starcharts/astro-core';
