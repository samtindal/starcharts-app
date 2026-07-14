'use client';

import { openPreferences } from '../../lib/ads/consent';
import { reopenFundingChoices } from '../../lib/ads/fundingChoices';

// Persistent footer control (CCPA/CPRA "Do Not Sell/Share" needs an
// always-available opt-out, not just a one-time banner). Prefers Funding
// Choices' own revocation message when that CMP is active; falls back to
// our own ConsentBanner otherwise.
export default function PrivacyChoicesLink() {
  return (
    <button
      type="button"
      className="footer-link-button"
      onClick={() => {
        if (!reopenFundingChoices()) openPreferences();
      }}
    >
      Manage privacy choices
    </button>
  );
}
