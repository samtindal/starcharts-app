# Starcharts | Security Audit (Firebase App Hosting architecture)

Date: 2026-07-12. Supersedes `docs/security-audit.md` (which audited the retired Cloud Run + Terraform + WIF stack). Scope: the current architecture, the Next.js web app on Firebase App Hosting (managed Cloud Run + Cloud Build + Google CDN, GitHub-connected auto-deploy), with Cloudflare proxied in front. The MCP server is deferred out of v1 and not hosted, so its findings stay parked (see the bottom). Method: manual source review plus architecture review. No dynamic testing against a live deployment.

## Summary

Starcharts remains a public, read-only, no-account, no-database site, so the attack surface is genuinely small. The migration to App Hosting removed the self-managed pipeline (no Terraform, no Workload Identity Federation, no Dockerfiles, no self-owned deployer service account), which retires a whole class of IAM/CI findings from the old audit. In exchange it concentrates trust in three managed accounts, GitHub (source + deploy trigger), Google/Firebase (build, runtime, secrets), and Cloudflare (DNS + edge), so account security and deploy-access control become the leading concerns.

No critical issues. Findings are hardening items ordered by domain, each with a severity, a launch-phase tag, and the agent-workflow task that mitigates it (see `docs/p1-scope-and-hardening-spec.md`). Severity: High (fix before launch), Medium (should fix), Low (hygiene / defense in depth).

## Trust model (what changed)

- **GitHub** holds the source and, via the Firebase GitHub app, triggers a build + rollout on every push to `main`. A merge to `main` is a production deploy.
- **Google / Firebase** runs Cloud Build (executes the build and any install scripts), runs the app on managed Cloud Run, and holds runtime secrets in Secret Manager. The App Hosting service account can read the secrets you grant it.
- **Cloudflare** terminates TLS at the edge, caches content, runs Bot Fight + rate limiting, and (via a Transform Rule) injects the origin-fence secret. It also controls DNS for starcharts.me.

Compromise of any one account is high impact, so the account-security and access-control findings below (SC and IAM families) matter more than they did under the keyless-WIF model.

## What Cloudflare covers, and what it does not

Covered by Cloudflare (free tier): volumetric DDoS, TLS termination and HSTS at the edge, Bot Fight Mode, one rate-limit rule, IP/geo firewall rules, and edge caching of the ISR content routes. Not covered at any tier: application logic, deploy-access control, secrets, Google/Firebase project IAM, and the full managed WAF (paid). Prerequisite: an edge only protects traffic that cannot bypass it (NET-1).

## Findings

### Supply chain and deploy access

#### SC-1. Push to `main` deploys to production. Severity: Medium. Phase: P1. Mitigation: B8.
App Hosting auto-builds and rolls out on every push to the live branch. Without branch protection, anyone who can push to `main` (or a compromised token/contributor) ships to production. Require pull-request review, passing CI status checks (`ci.yml`), and a restricted merge set on `main`. Consider requiring signed commits.

#### SC-2. Firebase GitHub app repository scope. Severity: Low. Phase: P1. Mitigation: B8.
The Firebase GitHub app is granted access to the repo to read source and trigger builds. Grant it the single repository, review its permissions periodically, and remove it if the backend is deleted.

#### SC-3. Build executes dependency and install scripts. Severity: Medium. Phase: P1. Mitigation: B5 (CICD-1).
Cloud Build runs `npm ci` and the Next build, which execute lifecycle/install scripts across the transitive tree. There is no dependency scanning yet. Add Dependabot or a scheduled `npm audit` / SCA job. `npm ci` against the committed `package-lock.json` preserves integrity; keep the lockfile authoritative.

#### SC-4. GitHub Actions pinned to mutable tags. Severity: Low. Phase: P1. Mitigation: B5 (CICD-2).
`ci.yml` references `actions/checkout@v4` and `actions/setup-node@v4`. Pin to full commit SHAs so a re-pointed tag cannot alter the test pipeline.

#### SC-5. Account security is now the master key. Severity: Medium. Phase: P1. Mitigation: B10.
Deploy, secrets, and DNS live behind the GitHub, Google/Firebase, and Cloudflare accounts. Enforce strong 2FA (prefer hardware or TOTP, not SMS) on all three, and review who has owner/admin on each. An account takeover on any of them is a full compromise.

### Network and edge

#### NET-1. Origin reachable directly, bypassing Cloudflare. Severity: Medium. Phase: P1. Mitigation: B6 (middleware).
The App Hosting backend has its own public URL. If a client hits it directly, it bypasses Cloudflare's cache, Bot Fight, and rate limiting. Because the origin is App Hosting-managed (no Cloud Run ingress knob), fence it in the app: a Cloudflare Transform Rule injects a secret header on every proxied request and `apps/web/middleware.ts` returns 403 when the header is missing or wrong. Allow App Hosting health checks.

#### NET-2. No rate limiting / caching without the edge. Severity: Low to Medium. Phase: P1. Mitigation: B6 (ops).
The origin has no app-level rate limiting. Cloudflare edge caching plus one rate-limit rule on the content routes is the mitigation, and caching is the larger lever, ISR pages change at most daily, so cache hits never wake an instance.

#### NET-3. Cloudflare TLS mode must be Full (strict). Severity: Medium. Phase: P1. Mitigation: B6 (ops).
If Cloudflare SSL/TLS is set to "Flexible," the Cloudflare-to-origin leg is plaintext and spoofable. Set Full (strict) so the edge validates the App Hosting managed cert, and set minimum TLS 1.2.

#### NET-4. Cache-rule correctness. Severity: Low. Phase: P1. Mitigation: B6 (ops).
Only public, non-personalized content should be edge-cached. Keep `/` (the live clock) bypassed; cache only `/aspects/*`, `/signs/*`, `/planets/*`, `/sky`, `/moon`, respecting origin `Cache-Control`. Ensure the cache key handles query strings so a date-scrub variant is never served to a different request. There is no per-user or PII content on the cached routes, which keeps cache-poisoning impact low.

### HTTP and transport

#### HTTP-1. No HTTP security headers. Severity: Medium. Phase: P1. Mitigation: B1.
`apps/web/next.config.mjs` sets no `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, or framing control. Add them via an `async headers()` block so they apply at the origin regardless of the edge. `Referrer-Policy: strict-origin-when-cross-origin` also limits PII leakage via Referer once ads load (supports DATA-1). A full nonce-based `script-src` CSP is a follow-up that can piggyback on the new middleware (HTTP-1b).

#### HTTP-1b. Full script-src CSP deferred. Severity: Low. Phase: P1 follow-up. Mitigation: B1 (note).
The clickjacking/framing directives ship now; a nonce-based `script-src` needs middleware and hydration testing. Now that `middleware.ts` is being added for the fence, thread a nonce through it as a fast-follow.

### Input handling and injection

#### INPUT-1. Route input validated against fixed enums. Status: OK (positive). Phase: P1.
Dynamic slugs resolve through `pointFromSlug` / `signFromSlug` / `parseAspectSlug`, returning known enum members or `notFound()`. The single `dangerouslySetInnerHTML` (JSON-LD on the planet-in-sign page) is built from validated enum values, not raw input, so there is no reflected-injection path. Re-verify whenever a new dynamic route is added.

#### INPUT-2. Date-scrub input. Severity: Low. Phase: P1. Mitigation: verify (Agent 5).
The P1 date input parses a calendar date to scrub the clock. It is client-side and carries no personal data; confirm an invalid or out-of-range value falls back safely and is never interpolated into markup.

### Data and privacy

#### DATA-1. Birth-data code still present in the repo. Severity: High if shipped with ads, else Medium. Phase: P1 (see caveat). Mitigation: Part A removal + B1 (Referrer-Policy).
`apps/web/components/BirthChart.tsx` still persists birth date/time/place to `localStorage` and the URL, and `/chart` and `/rising` are still routable. Part A of the hardening spec (birth-data removal) has not been executed yet. If these pages are live when ads/analytics ship, birth data is exposed via Cloudflare/App Hosting request logs, browser history, and the `Referer` header to third parties. Execute Part A (removes the component and pages, and the only client storage) and set `Referrer-Policy`. This is the single most important pre-launch item.

#### DATA-2. No secrets in the client bundle. Status: OK (positive). Phase: P1.
No `NEXT_PUBLIC_*` or `process.env` references leak into client code (verified). When ads land, keep keys server-side or in explicitly-public config only, and route the origin-fence secret and any private keys through Secret Manager, never inline in `apphosting.yaml` and never `NEXT_PUBLIC_`.

#### DATA-3. Request logging captures URLs and IPs. Severity: Low. Phase: P1. Mitigation: B9 (retention) + DATA-1.
Cloudflare and Cloud Logging record request URLs and client IPs. After DATA-1 is fixed there is no PII in URLs. Keep log retention modest and access-controlled.

### Secrets

#### SEC-1. No secrets committed. Status: strong (positive). Phase: P1. Mitigation: B10 (upkeep).
`git ls-files` shows no keys, `.env`, or credentials. `.gitignore` still carries Terraform-era rules; add Firebase artifacts (`.firebase/`, `firebase-debug.log`) and keep any future local env files ignored. The origin-fence secret and future ad keys live in Secret Manager, referenced from `apphosting.yaml` via `secret:`.

### Firebase / GCP IAM

#### IAM-1. Project and rollout access control. Severity: Medium. Phase: P1. Mitigation: B9.
Whoever holds Firebase/GCP project roles can trigger rollouts, read Secret Manager, and change configuration. Apply least privilege: limit Owner/Editor, give collaborators the narrowest App Hosting/viewer roles that work, and audit membership.

#### IAM-2. App Hosting runtime service account scope. Severity: Low to Medium. Phase: P1. Mitigation: B9.
Grant the App Hosting runtime service account access to only the specific Secret Manager secrets it needs (the origin-fence secret, later the ad keys), nothing broader. It needs no other project roles.

#### IAM-3. Cost-availability (budget) protection. Severity: Low. Phase: P1. Mitigation: B9.
A traffic flood or a caching misconfiguration can run up egress or Cloud Build minutes. Set Cloud Billing budget alerts (for example $20 and $75/month) as an early-warning tripwire.

### Containers and runtime

#### CON-1. Non-root, minimal runtime. Status: OK, now managed. Phase: P1.
App Hosting builds and runs the container; the previous repo-owned non-root Dockerfile is retired. Runtime hardening is now Google-managed rather than repo-controlled.

### Dependencies

#### DEP-1. Minimal, reputable dependency set. Status: OK with the SC-3 caveat. Phase: P1. Mitigation: B5 (CICD-1).
`next`, `react`, `astronomy-engine` (the only ephemeris, no Swiss Ephemeris), plus zod/express/MCP SDK in the unhosted MCP package. No automated vulnerability monitoring yet.

### PWA

#### PWA-1. Service worker caching hygiene. Severity: Low. Phase: P1. Mitigation: verify (Agent 5).
Ensure the service worker does not cache fence-protected or dynamic responses and that its scope is limited to public assets.

## Deferred with the MCP server (not hosted in v1)

HTTP-2 (raw error strings), AUTH-1 (weak in-process rate limiter), AUTH-2 (no app auth, by design), and CICD-4 (tsx in production) all belong to `apps/mcp`, which is paused and unhosted. They return when the MCP server resumes and is given its own hosting.

## Prioritized next steps

1. Execute Part A to remove the birth-data code before ads ship (DATA-1). Highest priority.
2. Add origin security headers via `next.config.mjs` (HTTP-1); also supports DATA-1.
3. Build the origin fence: Cloudflare Transform Rule + `middleware.ts` (NET-1), and set Cloudflare Full (strict) + cache rules (NET-3, NET-4, NET-2).
4. Lock deploy access: branch protection on `main` and review the Firebase GitHub app (SC-1, SC-2), and enforce 2FA on GitHub/Google/Cloudflare (SC-5).
5. Least-privilege the Firebase project and runtime SA, and set budget alerts (IAM-1, IAM-2, IAM-3).
6. Add dependency scanning and pin the CI Actions (SC-3, SC-4).

## Finding to task matrix

| Finding | Severity | Mitigation task | Owner |
|---|---|---|---|
| SC-1 push-to-deploy | Med | B8 | Agent 4 |
| SC-2 GitHub app scope | Low | B8 | Agent 4 |
| SC-3 build/dep scanning | Med | B5 (CICD-1) | Agent 4 |
| SC-4 pin Actions | Low | B5 (CICD-2) | Agent 4 |
| SC-5 account 2FA | Med | B10 | Agent 4 |
| NET-1 origin fence | Med | B6 middleware | Agent 3 |
| NET-2 edge rate/cache | Low-Med | B6 ops | Agent 4 |
| NET-3 TLS Full strict | Med | B6 ops | Agent 4 |
| NET-4 cache correctness | Low | B6 ops | Agent 4 |
| HTTP-1 headers | Med | B1 | Agent 3 |
| HTTP-1b script-src CSP | Low | B1 follow-up | Agent 3 |
| INPUT-1 route enums | OK | verify | Agent 5 |
| INPUT-2 date input | Low | verify | Agent 5 |
| DATA-1 birth-data removal | High* | Part A + B1 | Agent 1 |
| DATA-2 no client secrets | OK | B10 upkeep | Agent 3 |
| DATA-3 log retention | Low | B9 | Agent 4 |
| SEC-1 no committed secrets | OK | B10 | Agent 4 |
| IAM-1 project access | Med | B9 | Agent 4 |
| IAM-2 runtime SA scope | Low-Med | B9 | Agent 4 |
| IAM-3 budget alerts | Low | B9 | Agent 4 |
| PWA-1 service worker | Low | verify | Agent 5 |
| DEP-1 deps | OK | B5 | Agent 4 |

*High only if birth-data pages are live when ads ship; removing them (Part A) resolves it.
