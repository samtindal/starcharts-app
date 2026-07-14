// Google's own CMP (Funding Choices), the owner-chosen path for EEA/UK
// personalized-ad consent (2026-07-13), enabled from the AdSense console
// under "Privacy & messaging". That console step generates the account's
// message config; there is no separate ID to configure here beyond turning
// it on, Funding Choices auto-detects the AdSense publisher ID from
// NEXT_PUBLIC_ADSENSE_CLIENT. Until NEXT_PUBLIC_GOOGLE_CMP_ENABLED=true, this
// module is a no-op and ConsentBanner remains the sole consent gate, so nothing
// breaks pre-setup.

declare global {
  interface Window {
    googlefc?: {
      callbackQueue?: unknown[];
      showRevocationMessage?: () => void;
    };
  }
}

let loadStarted = false;

export function fundingChoicesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_CMP_ENABLED === 'true' && Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
}

/**
 * Loads Funding Choices and wires its resolution into onResolved. Google's
 * script determines region/message eligibility itself (EEA/UK show the
 * consent message, elsewhere it resolves immediately); onResolved should
 * bridge that into consent.ts so AdSlot and every other consumer read one
 * state regardless of which CMP produced it.
 */
export function loadFundingChoices(onResolved: (personalized: boolean) => void) {
  if (typeof window === 'undefined' || loadStarted || !fundingChoicesEnabled()) return;
  loadStarted = true;
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://fundingchoicesmessages.google.com/i/${client}?ers=1`;
  document.head.appendChild(script);

  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({
    CONSENT_DATA_READY: () => {
      // Funding Choices has resolved (message shown + answered, or the
      // visitor is outside a region that requires one). It manages Consent
      // Mode v2 signals itself; the personalized flag here only needs to be
      // "truthy enough" to unblock AdSlot's mount, the actual ad_storage /
      // ad_personalization grant Google's own tag already set.
      onResolved(true);
    },
  });
}

/** Reopen the Funding Choices consent message, if it is active. */
export function reopenFundingChoices(): boolean {
  if (typeof window === 'undefined' || !window.googlefc?.showRevocationMessage) return false;
  window.googlefc.showRevocationMessage();
  return true;
}
