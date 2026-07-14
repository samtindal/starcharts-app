'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent, onConsent, onOpenPreferences, initRegionDefault } from '../../lib/ads/consent';
import { fundingChoicesEnabled, loadFundingChoices } from '../../lib/ads/fundingChoices';

// Fallback consent UI (adslot-component-spec.md §7, tasks/e4-privacy-policy.md).
// The owner-chosen CMP path is Google's own consent tool (Funding Choices,
// enabled from the AdSense console, see fundingChoices.ts): once that is
// configured it renders its own EEA/UK banner and this component mostly
// stays quiet there. Until then, and everywhere Funding Choices does not
// cover (non-regulated regions' persistent opt-out control), this banner is
// the real consent gate, not a placeholder.
//
// Shows automatically on first visit only in a regulated region (EEA/UK/CH,
// via initRegionDefault -> /api/region) or when Global Privacy Control is
// set; elsewhere ads/analytics default on and this stays hidden until the
// visitor opens "manage privacy choices" from the footer.
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const usingFundingChoices = fundingChoicesEnabled();

  useEffect(() => {
    if (usingFundingChoices) {
      // Funding Choices renders its own EEA/UK message overlay; still run
      // the region default for the non-ad-related consumers of consent.ts
      // (product analytics) and for regions Funding Choices does not gate.
      initRegionDefault();
      loadFundingChoices((personalized) => setConsent(personalized));
      return;
    }
    setVisible(!getConsent().ready);
    initRegionDefault();
    const unConsent = onConsent(() => setVisible(false));
    const unReview = onOpenPreferences(() => setVisible(true));
    return () => {
      unConsent();
      unReview();
    };
  }, [usingFundingChoices]);

  if (usingFundingChoices || !visible) return null;

  return (
    <div className="consent-banner" role="dialog" aria-label="Privacy choices">
      <p>
        Starcharts uses cookies for basic analytics and, once you agree, ad personalization. See the{' '}
        <a href="/privacy">privacy policy</a> for details, or come back to this any time from the footer&rsquo;s
        &ldquo;manage privacy choices&rdquo; link.
      </p>
      <div className="consent-actions">
        <button onClick={() => setConsent(false)}>Decline</button>
        <button onClick={() => setConsent(true)} className="consent-accept">Accept</button>
      </div>
    </div>
  );
}
