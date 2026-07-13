# Starcharts | P1 Scope Enforcement and Hardening Spec

Date: 2026-07-12. Purpose: a precise, executable brief for a separate multi-agent workflow. Two goals: (A) remove all birth-data (P2) code so v1 ships as date-scrubbing only, and (B) implement the P1 security mitigations from the security audit. Every task lists exact files and an acceptance check so an agent can verify its own work. Current audit: `docs/security-audit-apphosting.md` (Firebase App Hosting + Cloudflare); the older `docs/security-audit.md` audited the retired Cloud Run stack and is kept only for history and the deferred MCP findings.

Scope note (owner decision 2026-07-12): the MCP server is paused and no part of it launches in v1. The MCP-only tasks below (A5, B2, B3) are therefore deferred out of P1 and run only when the service resumes; the web app and the shared engine are the P1 surface.

Hosting note (2026-07-12): the web app migrated to Firebase App Hosting (see `docs/firebase-migration-runbook.md`), which retires the self-managed Cloud Run + Terraform + GitHub Actions stack. This supersedes the infra-side Part B tasks: **B4 (IAM-1 WIF branch scoping) is obsolete** (no WIF), and in **B5, CICD-3 (pin Dockerfile base) is obsolete** (no Dockerfiles) while CICD-1 (dependency scanning) and CICD-2 (pin the remaining Actions in `ci.yml`) still apply. **B6 applies:** Cloudflare is proxied in front of App Hosting (edge decision 2026-07-12), so fence the App Hosting origin (a Cloudflare Transform Rule injecting a secret header, rejected in `apps/web/middleware.ts` if absent) so the raw origin URL cannot bypass the edge (NET-1). NET-2 (edge caching + rate limiting) is handled by the Cloudflare cache rule on the content routes plus Bot Fight. **B1 (security headers via `next.config.mjs`) still applies unchanged and is now the clearest-owned hardening item.**

## Hard constraints (do not violate)

1. The P1 date input that scrubs the live clock/chart to a calendar date STAYS. It is not birth data. Only birth date, time, and place (natal, rising, synastry) are in scope for removal.
2. No client-side storage may remain after this work. After removal, a repo-wide search for `localStorage`, `sessionStorage`, `document.cookie`, and `indexedDB` in `apps/web` must return zero matches. Today the only match is `apps/web/components/BirthChart.tsx` (key `starcharts.birth`); it goes away with that file.
3. Follow repo conventions in CLAUDE.md: no em dashes anywhere, titles use "|", palette and symbol rules unchanged. `npm test` must pass at the end.
4. Preserve all P1 features: live clock, drag, date input, aspects/signs/planets/planet-in-sign content pages, sky-today and Moon pages, PWA. The MCP server is out of v1 scope (see the scope note above), so its tools are not a P1 feature to preserve or deploy.

---

## Part A: Remove birth-data (P2) code

### A0. Shared-engine toggle (one decision)

`packages/astro-core/src/natal.ts` (natalChart, transitAspects, synastry) and `houses.ts` (ascendantMC, wholeSignHouses) are pure, DOM-free, storage-free math with passing invariant tests. They carry no security or privacy risk on their own. Choose one:

- KEEP (recommended): leave the files, but remove their re-exports from `src/index.ts` so nothing outside the package can reach them. P2 re-enable becomes a one-line export change. Keep their tests.
- DELETE: remove `natal.ts`, `houses.ts`, their `index.ts` exports, and the natal/ascendant/synastry test blocks in `test/core.test.ts` and `test/b3.test.ts`. P2 restores from git history.

The tasks below assume KEEP. If DELETE is chosen, also apply A6.

### A1. Delete the birth-data web UI

Delete these files (each is used only by the birth-data tool; importer check confirmed):
- `apps/web/components/BirthChart.tsx` (this file is finding DATA-1: the localStorage + URL PII persistence)
- `apps/web/components/NatalWheel.tsx`
- `apps/web/lib/cities.ts`
- `apps/web/lib/tz.ts`

Acceptance: `grep -rniE "BirthChart|NatalWheel|/lib/(cities|tz)" apps/web` returns nothing outside deleted files.

### A2. Delete the birth-data pages

Delete:
- `apps/web/app/chart/page.tsx` (and the `apps/web/app/chart/` directory)
- `apps/web/app/rising/page.tsx` (and the `apps/web/app/rising/` directory)

Acceptance: routes `/chart` and `/rising` no longer exist; a production build lists neither.

### A3. Remove navigation links

In `apps/web/app/layout.tsx`, remove the `Rising` links from both the header `nav` and the footer `nav`. Leave the other links (Sky today, Aspects, Signs, Planets). Optionally trim the footer sentence clause about birthplace timezones and city data, since that data set is being removed; keep the ephemeris and GeoNames attribution only if any city data remains (it will not, so remove the birthplace/timezone clause).

Acceptance: rendered header and footer contain no "Rising" link; no dead `Link href="/rising"` or `/chart` remains.

### A4. Remove sitemap entries

In `apps/web/app/sitemap.ts`, remove the `/rising` and `/chart` URL entries. Leave every other entry unchanged.

Acceptance: `sitemap.xml` output contains no `/rising` or `/chart` URL.

### A5. Remove the MCP birth-data tools (DEFERRED out of P1: the MCP server is paused and does not launch in v1; do this when the service resumes)

In `apps/mcp/src/server.ts`, remove the three birth-data tool registrations: `get_natal_chart`, `get_transits`, `get_synastry`. Remove the now-unused imports `natalChart`, `transitAspects`, `synastry` from the astro-core import. Keep `get_current_chart`, `get_chart`, `get_aspects`, the rate limiter, `/api/chart`, and `/healthz`.

In `apps/mcp/test/format.test.ts`, remove the "applies cross-chart labels (transits, synastry)" case if it now tests a path no tool exercises; the `describeAspects` helper itself can stay (still used by `get_aspects`).

Acceptance: `POST /mcp` advertises exactly three tools; `npm test` in `apps/mcp` passes.

### A6. Only if A0 = DELETE

- Delete `packages/astro-core/src/natal.ts` and `packages/astro-core/src/houses.ts`.
- Remove their exports from `packages/astro-core/src/index.ts` (the `./natal.js` and `./houses.js` lines and their `type` exports).
- Remove the natal/transits/synastry describe block from `test/core.test.ts` and the "B3 §8: Ascendant / MC" block plus `wholeSignHouses`/`ascendantMC` references from `test/b3.test.ts`.

Acceptance: `grep -rniE "natalChart|transitAspects|synastry|ascendantMC|wholeSignHouses" packages/astro-core` returns nothing.

### A7. Final scope verification (run after A1 to A6)

- `grep -rniE "localStorage|sessionStorage|document.cookie|indexedDB" apps/web` returns zero matches. (Constraint 2.)
- `grep -rni "birth" apps/web` returns only incidental prose, no birth-data inputs, forms, or state.
- `npm test` passes across all workspaces.
- A production build of `apps/web` succeeds and the clock, a content page, and the sky/moon pages render. The date input still scrubs the clock. (Constraint 1.)

---

## Part B: Implement P1 security mitigations

Each task traces to a finding id in `docs/security-audit-apphosting.md` (finding-to-task matrix at the bottom of that doc).

### B1. Origin security headers (HTTP-1)

Add an `async headers()` block to `apps/web/next.config.mjs` applying to all routes:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` with at least `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`.

Note: a full `script-src` nonce-based CSP requires Next.js middleware and must be tested against hydration and the JSON-LD script; scope that as a follow-up rather than shipping a `script-src` that breaks the wheel. The directives above are safe to ship as-is.

Acceptance: `curl -sI https://<origin>/` shows all five headers; the interactive clock and a content page still work.

### B2. Stop leaking error strings (HTTP-2) (DEFERRED out of P1: MCP-only; the MCP server does not launch in v1)

In `apps/mcp/src/server.ts`, replace `String(err)` in the `/api/chart` (400) and `/mcp` (500) responses with a generic message (for example `{ error: 'Bad request' }` / `{ error: 'Internal error' }`) and `console.error` the real error server-side.

Acceptance: a malformed `/api/chart?date=xxx` returns a generic message with no internal detail; the real error appears in logs.

### B3. Fix the rate-limiter proxy trust (AUTH-1) (DEFERRED out of P1: MCP-only; the MCP server does not launch in v1)

In `apps/mcp/src/server.ts`, change `app.set('trust proxy', true)` to trust a fixed hop count for Cloud Run's front proxy (for example `app.set('trust proxy', 1)`), so `X-Forwarded-For` cannot be spoofed to mint fresh rate-limit buckets. Add a short comment that the in-process limiter is a courtesy throttle only (per-instance, resets on cold start) and that the real limit lives at the edge (see B6).

Acceptance: a request sending a forged `X-Forwarded-For` is still counted against the caller's real ip.

### B4. Restrict CI identity to the main branch (IAM-1)

In `infra/main.tf`, tighten the Workload Identity Federation so only the `main` branch can impersonate the deployer:
- Add `attribute.ref = "assertion.ref"` to the provider `attribute_mapping`.
- Extend `attribute_condition` to also require `assertion.ref == "refs/heads/main"` (keep the existing repository check).

Acceptance: `terraform plan` shows only the intended provider change; a deploy from a non-main ref would fail attribute validation.

### B5. CI and container supply-chain hardening (CICD-1, CICD-2, CICD-3)

- CICD-1: add dependency scanning. Either commit a `.github/dependabot.yml` (npm ecosystem, weekly) or add a CI step running `npm audit --audit-level=high` (non-blocking to start).
- CICD-2: pin every GitHub Action in `.github/workflows/deploy.yml` to a full commit SHA instead of `@v4` / `@v2` (keep a comment noting the version).
- CICD-3: pin the web Dockerfile's `FROM node:22-slim` to a `@sha256:` digest, and enable Artifact Registry vulnerability scanning on the repository. (The MCP Dockerfile is deferred with the paused MCP server.)

Acceptance: workflow references are 40-char SHAs; Dockerfiles reference an image digest; a dependency scan runs in CI.

### B6. Edge and origin fencing (NET-1, NET-2)

Edge decision made 2026-07-12: Cloudflare proxied in front of Firebase App Hosting. Two parts, one ops and one repo code:

1. **Ops (Cloudflare console, no repo change), see `docs/firebase-migration-runbook.md` step 6:** proxy DNS (orange cloud); SSL/TLS **Full (strict)** with **minimum TLS 1.2** so the edge-to-origin leg is validated and encrypted (NET-3); a cache rule on `/aspects/*`, `/signs/*`, `/planets/*`, `/sky`, `/moon` that respects origin Cache-Control with a cache key that includes query strings, `/` bypassed (NET-4); Bot Fight Mode plus one rate-limit rule on the content routes (NET-2). Verify Googlebot and unfurlers are not blocked.
2. **Repo code (NET-1 origin fence):** add a Cloudflare Transform Rule that injects a secret request header on every proxied request, and add `apps/web/middleware.ts` that reads the same secret from App Hosting env (Cloud Secret Manager, referenced via `apphosting.yaml`) and returns 403 for requests whose header is missing or mismatched. Allow App Hosting health checks through. The secret is server-only, never in the client bundle. This is the App Hosting equivalent of the old Cloud Run ingress lock (which no longer applies, App Hosting manages the origin).

Acceptance: the raw App Hosting backend URL returns 403 without the secret header; `https://starcharts.me` (through Cloudflare) serves and caches the content routes; `/` stays uncached. The Transform Rule and the middleware share one secret.

### B7. Retired / deferred lower-priority items

Under App Hosting these old items no longer apply: IAM-2 (deployer role) and IAM-4 (Terraform remote state) are obsolete (no self-owned deployer, no Terraform). CICD-4 (MCP tsx-in-prod) is deferred with the paused MCP server. Replaced by B8 to B10 below, which cover the App Hosting attack surface.

### B8. Deploy-access control (SC-1, SC-2)

App Hosting rolls out on every push to `main`, so gate what reaches it. In GitHub:
- Protect `main`: require a pull request, at least one review, and passing `ci.yml` status checks before merge; restrict who can push/merge. Consider requiring signed commits.
- Scope the Firebase GitHub app to the single repo; review its access periodically.

Acceptance: a direct push to `main` without a passing PR is rejected; the Firebase GitHub app lists only this repository.

### B9. Firebase / GCP project IAM and cost tripwires (IAM-1, IAM-2, IAM-3, DATA-3)

- Least-privilege the project: limit Owner/Editor, give collaborators the narrowest App Hosting/viewer roles that work, audit membership.
- Grant the App Hosting runtime service account access to only the specific Secret Manager secrets it needs (origin-fence secret, later ad keys), nothing more.
- Set Cloud Billing budget alerts (for example $20 and $75/month) as a flood/misconfig tripwire.
- Keep Cloud Logging retention modest and access-controlled.

Acceptance: no human holds broader than needed on the project; the runtime SA can read only the named secret(s); a budget alert exists.

### B10. Secrets and account hygiene (SC-5, SEC-1, DATA-2 upkeep)

- Enforce strong 2FA (hardware or TOTP, not SMS) on the GitHub, Google/Firebase, and Cloudflare accounts; review owners/admins on each.
- Add Firebase artifacts to `.gitignore` (`.firebase/`, `firebase-debug.log`); keep any local env files ignored.
- All secrets (origin-fence header, future ad keys) go through Secret Manager referenced from `apphosting.yaml` via `secret:`, never inline and never `NEXT_PUBLIC_`.

Acceptance: 2FA enforced on all three accounts; `git ls-files` shows no secrets; no secret value appears in `apphosting.yaml` or the client bundle.

---

## Suggested agent decomposition

- Agent 1 (web scope): Part A tasks A1 to A4, A7 web checks.
- Agent 2 (engine): A0/A6, A7 test checks. (A5 deferred with the paused MCP server.)
- Agent 3 (web security): B1 (security headers + HTTP-1b CSP follow-up), the B6 origin-fence middleware (`apps/web/middleware.ts` + `apphosting.yaml` secret wiring), and DATA-2 upkeep. (B2 deferred with the paused MCP server.)
- Agent 4 (infra/CI + console): B5 (CICD-1 dependency scan + CICD-2 pin the Actions in `ci.yml`), B6 ops (Cloudflare console: Full-strict TLS, cache rules, Bot Fight, rate limit, Transform Rule), B8 (deploy-access control), B9 (project IAM + runtime SA + budget alerts), B10 (secrets + account 2FA). (B3 deferred with the paused MCP server; B4 and B7 obsolete under App Hosting.)
- Agent 5 (verify): runs `npm test`, a production build, and the Part A7 / Part B acceptance greps; owns the final sign-off. Verifies INPUT-1 (route enums), INPUT-2 (date input), DATA-2 (no secret in the client bundle), PWA-1 (service worker scope), that the HTTP-1 headers are present, that the NET-1 fence returns 403 on the raw origin, and that the birth-data grep is zero. B6 has two parts: Cloudflare console (Agent 4) and the origin-fence middleware (Agent 3).

Dependencies: A0/A6 is engine-only now (A5 is deferred with the paused MCP server). B1 stands alone (B2 deferred). B6's edge decision is made (Cloudflare in front of App Hosting, 2026-07-12); its middleware half depends on the App Hosting env secret being provisioned (runbook step 7).
