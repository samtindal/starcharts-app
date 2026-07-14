// GDPR/UK-GDPR applies to the EEA, the UK, and Switzerland (which mirrors GDPR
// via its own FADP). Ads/analytics default OFF (opt-in) here; everywhere else
// defaults ON with a persistent opt-out (CCPA/CPRA path + Global Privacy
// Control), per tasks/e4-privacy-policy.md and the consent UX called out in
// e1-growth-ads.md as a legitimate revenue lever, not just a compliance cost.
const REGULATED_COUNTRIES = new Set([
  // EEA (EU 27 + EEA-only members)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO',
  // UK and Switzerland
  'GB', 'CH',
]);

export function isRegulatedRegion(countryCode: string | null | undefined): boolean {
  if (!countryCode) return true; // unknown origin: fail safe to the stricter opt-in gate
  return REGULATED_COUNTRIES.has(countryCode.toUpperCase());
}
