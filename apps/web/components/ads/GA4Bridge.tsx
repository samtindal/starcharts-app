'use client';

import { useEffect } from 'react';
import { onConsent } from '../../lib/ads/consent';
import { ga4Enabled, loadGA4, trackToGA4 } from '../../lib/ads/ga4';
import { addSink } from '../../lib/analytics';

// Loads GA4 once consent resolves (any path: banner, Funding Choices, or the
// region-based auto-consent default) and forwards product events to it.
// A no-op whenever NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set.
export default function GA4Bridge() {
  useEffect(() => {
    if (!ga4Enabled()) return;
    const unSink = addSink(trackToGA4);
    const unConsent = onConsent((consent) => {
      if (consent.ready) loadGA4();
    });
    return () => {
      unSink();
      unConsent();
    };
  }, []);
  return null;
}
