// Minimal product-events bus (tasks/e1-growth-ads.md "instrument for yield,
// not just engagement"). Same network-agnostic seam as lib/ads/provider.ts:
// one track() call site per event, a swappable sink. No vendor (GA4 /
// Plausible) is wired in yet, that is a follow-up account decision, not a
// code gap; the default sink is a no-op so nothing breaks pre-decision.
// Also the interaction signal AdSlot's clock refresh gate reads (adslot-
// component-spec.md §8), so it exists independent of which vendor lands.

import { getConsent } from './ads/consent';

export type AnalyticsEvent =
  | { name: 'drag_start'; body: string }
  | { name: 'date_jump'; deltaMs: number }
  | { name: 'aspect_tap'; a: string; type: string; b: string }
  | { name: 'share_click'; surface: string };

type Sink = (e: AnalyticsEvent) => void;
const sinks: Sink[] = [];

let lastInteractionMs = 0;

export function track(event: AnalyticsEvent) {
  lastInteractionMs = Date.now();
  if (!getConsent().ready) return; // essential-only until consent resolves
  for (const sink of sinks) sink(event);
}

/** Register a vendor sink (GA4, Plausible, etc). Returns an unsubscribe function. */
export function addSink(sink: Sink): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

/** Milliseconds since the last tracked interaction; drives AdSlot's clock refresh gate. */
export function msSinceLastInteraction(): number {
  return Date.now() - lastInteractionMs;
}
