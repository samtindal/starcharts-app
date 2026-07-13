# E4 | Privacy Policy & Consent (P1 launch gate once ads ship)

Depends on E1 (ads/analytics). Required before ads serve in v1: AdSense/GAM and any analytics set cookies and process personal data, which triggers a published-policy and consent obligation. The security audit twice notes there is currently no privacy policy.

## Scope

- **`/privacy` page** (server component, App Router), linked from the footer on every page. Plain-language: what is collected, why, by whom, and how to opt out.
- **What v1 actually collects:** analytics events (drags, date jumps, page views) and advertising cookies via AdSense/GAM. Disclose these. State plainly that **v1 collects no birth data** (birth-data features are P2 and trimmed from v1 per the scope-and-hardening spec), so there is no natal/PII surface to describe.
- **Consent:** GDPR/UK-GDPR and CCPA/CPRA. Implement Google **consent mode v2** with a consent banner that gates non-essential (ad + analytics) storage until the EU/UK visitor chooses; honor a Global Privacy Control signal and a "Do Not Sell/Share" path for CA. AdSense in the EEA/UK also requires a Google-certified CMP (IAB TCF), so use a certified CMP or Google's own consent management.
- **Cookie disclosure:** list the cookie families (ad, analytics) and their purpose; link Google's "How Google uses data" page.
- **Referrer-Policy** is already set at the origin (HTTP-1, hardening spec B1); reference it as part of the data-minimization posture.
- **Contact + effective date + change process.** A ToS/Refund policy is not in E4 scope (those ride with the P2 paid-reports Merchant-of-Record framing).

## Acceptance

- `/privacy` renders, is in the sitemap, and is linked from the footer sitewide.
- Ads and analytics do not set non-essential cookies for an EU/UK visitor before consent; a decline keeps them off.
- A CA visitor has a working opt-out path and GPC is honored.
- Copy follows repo conventions: title uses "|", no em dashes, palette/symbol rules unchanged.

## Notes

- Not required until E1 ads/analytics land; if a truly ad-free, analytics-free soft launch ships first, E4 can trail it, but ads are a P1 Definition-of-Done item, so E4 gates the same launch.
- MCP is deferred out of v1, so no API-key or MCP data handling needs disclosure in the v1 policy.
