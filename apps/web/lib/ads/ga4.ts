// GA4 (Google Analytics), the vendor chosen for product analytics (over
// Plausible) because it integrates natively with the Consent Mode v2 default
// signals consent.ts already sets on init: gtag.js reads the current
// dataLayer consent state itself, so loading it after consent resolves is
// enough, no separate personalization logic needed here. Same shape as
// providers/adsense.ts and fundingChoices.ts: a no-op until the measurement
// ID env var exists, so nothing breaks pre-setup.

import type { AnalyticsEvent } from '../analytics';

let loadStarted = false;

export function ga4Enabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

/** Loads gtag.js and configures the GA4 property. Consent Mode v2 defaults (consentMode.ts) must already be set before this runs, which consent.ts guarantees via its init(). */
export function loadGA4() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (typeof window === 'undefined' || loadStarted || !measurementId) return;
  loadStarted = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/** lib/analytics.ts sink: forwards product events as GA4 custom events. Registered unconditionally; track() already gates on consent before calling any sink. */
export function trackToGA4(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) return;
  const { name, ...params } = event;
  window.gtag('event', name, params);
}
