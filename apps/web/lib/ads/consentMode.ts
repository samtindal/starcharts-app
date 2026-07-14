// Google Consent Mode v2: the dataLayer/gtag signal Google's own tags
// (Funding Choices, AdSense, and any future GA4 tag) read to decide whether
// to fire storage/personalization at all. Independent of which CMP is
// active, set the default to "denied" as early as possible (before any
// Google script loads) and update it whenever consent.ts's state changes,
// so Funding Choices and AdSense agree with our own gate rather than
// re-deciding on their own.

export type ConsentModeState = { ready: boolean; personalized: boolean };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Call once, as early as possible, before any Google script tag loads. */
export function setConsentModeDefault() {
  if (typeof window === 'undefined') return;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
}

/** Call whenever consent.ts's ConsentState resolves or changes. */
export function updateConsentMode(state: ConsentModeState) {
  if (typeof window === 'undefined' || !state.ready) return;
  const granted = state.personalized ? 'granted' : 'denied';
  gtag('consent', 'update', {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    // Product analytics is privacy-light regardless of ad personalization
    // (lib/analytics.ts); grant it whenever consent has resolved at all.
    analytics_storage: 'granted',
  });
}
