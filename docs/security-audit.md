# Starcharts | Security Audit (RETIRED Cloud Run stack)

> **Superseded 2026-07-12 by `docs/security-audit-apphosting.md`.** The web app moved to Firebase App Hosting + Cloudflare, which retired the Cloud Run + Terraform + WIF stack this document audits. Kept for history and for the MCP-server findings (which return when MCP resumes). For the current architecture and the live finding-to-task matrix, read the App Hosting audit.

Date: 2026-07-12. Scope: full repository (apps/web, apps/mcp, packages/astro-core, infra, CI/CD). Method: manual source review. No dynamic testing against a live deployment.

## Summary

Starcharts is a public, read-only, no-account, no-database site. There is no login, no session, no server-side writes, and no third-party secrets in the runtime path. That makes the attack surface genuinely small, and the baseline posture is good: no secrets committed, keyless CI via Workload Identity Federation, least-privilege runtime service account, non-root containers, enum-validated route input, and a body-size cap on the API.

No critical issues were found. The findings below are hardening items, ordered by domain with a severity rating and a note on whether a Cloudflare free-tier edge would address them. The recurring theme: an edge (Cloudflare) protects the network and transport layers, but most of this list lives in application logic, data handling, CI/CD, and IAM, where an edge has no visibility.

Severity scale: High (fix soon), Medium (should fix), Low (hygiene / defense in depth).

## Where Cloudflare free tier helps, and where it does not

Covered by Cloudflare free tier: volumetric DDoS (L3/L4 and much L7), TLS termination and HSTS, Bot Fight Mode, one rate-limiting rule, IP and geo firewall rules, edge caching, and the free managed ruleset (emergency CVE mitigations only, not full WAF).

Not covered at any tier: application logic and injection, auth and authorization, data handling and PII, CI/CD and supply chain, GCP IAM, and secrets. The full OWASP-style managed WAF requires a paid plan.

Prerequisite: an edge only protects traffic that cannot bypass it. See NET-1.

## Launch-phase mapping (P1 vs P2)

Each finding below carries a "Launch phase" tag against the v1 (P1) scope defined in PLAN.md. Note the 2026-07-12 re-scope: all birth-data features (natal overlay, transit-to-natal, Big Three / Rising sign) moved P1 to P2 to trim v1 to date-scrubbing only. The code for those features already shipped into the repo, so a concern can be P2 in scope while being present in the running code today.

P1 launch surface: the live clock plus drag plus date input, the SEO content pages (aspects, signs, planets, planet-in-sign), the sky-today and Moon pages, ads on content pages, and the PWA, all deployed through the Cloud Run plus CI/CD plus IAM stack. Every finding that touches those, which is nearly all of them including all infrastructure and pipeline items, is P1. The MCP server is deferred out of v1 (owner decision 2026-07-12): it is paused and no part of it launches in P1, so the MCP-only findings HTTP-2, AUTH-1, and CICD-4 move to P2 and are addressed when the service resumes.

P2 only: DATA-1. Birth date, time, and place are collected only by the natal and rising-sign UI, which is a P2 feature. The date input that is in P1 scrubs the clock to a calendar date and carries no personal data. Caveat: because the natal code has shipped and ads are a P1 item, if the birth-data pages are reachable at launch alongside ads, the DATA-1 Referer leak becomes live during P1 even though the feature is nominally P2. Confirm those pages are gated out of the v1 build, or treat DATA-1 as P1.

At-a-glance: P1 = NET-1, NET-2, HTTP-1, AUTH-2, IAM-1, IAM-2, IAM-3, IAM-4, CICD-1, CICD-2, CICD-3, DEP-1 (and the positives INPUT-1, DATA-2, SEC-1, CON-1). P2 = DATA-1 (with the P1 caveat above), plus the MCP-only findings HTTP-2, AUTH-1, and CICD-4, deferred with the paused MCP server.

## 2026-07-12 hosting migration: Firebase App Hosting supersedes several findings

The web app moved from a self-managed Cloud Run + Terraform + GitHub Actions stack to Firebase App Hosting (managed Cloud Run + CDN, GitHub-connected deploys). App Hosting owns the build, the container, the runtime service account, and the deploy identity, which removes the self-owned pipeline these findings assumed. Disposition:

- Obsolete (no longer applicable): IAM-1 (Workload Identity Federation branch scoping) and IAM-4 (Terraform remote state), because there is no self-managed WIF or Terraform; IAM-2 (broad deployer role), because there is no self-owned deployer service account; CICD-3 (pin Dockerfile base image), because the Dockerfiles were retired.
- Changed owner: IAM-3 (runtime SA) and CON-1 (non-root minimal container) are now managed by App Hosting rather than by repo Terraform/Dockerfiles; still fine, but not repo-controlled.
- NET-1 (origin fencing) applies, with a new mechanism: Cloudflare is proxied in front of App Hosting (edge decision 2026-07-12), so the App Hosting origin must reject traffic that bypasses Cloudflare. Because the origin is App Hosting-managed (no self-owned Cloud Run ingress to lock down), fence it in the app: a Cloudflare Transform Rule injects a secret header and `apps/web/middleware.ts` rejects requests without it. Fast-follow, not a launch blocker. NET-2 (edge rate limiting / caching) is addressed by the Cloudflare cache rule on the content routes plus Bot Fight and one rate-limit rule.
- Still fully in force (repo-level, unchanged by hosting): HTTP-1 (security headers via `next.config.mjs`), CICD-1 (dependency scanning of the npm tree), CICD-2 (pin the remaining GitHub Actions in `ci.yml`), DEP-1, and the input/data positives INPUT-1, DATA-2, SEC-1.
- New under App Hosting (track when relevant): App Hosting env/secret handling via Cloud Secret Manager (needed when E1 ads add keys), and Firebase project-level IAM hygiene.

## Network and edge

### NET-1. Origin is reachable directly, bypassing any future edge. Severity: Medium. Launch phase: P1.
Both Cloud Run services use `ingress = INGRESS_TRAFFIC_ALL` and an `allUsers` invoker binding, so the `*.run.app` URL is publicly reachable. If Cloudflare (or any WAF) is placed in front by DNS, an attacker who discovers the origin URL bypasses it entirely. Before relying on an edge, restrict origin ingress (Cloud Run "internal and Cloud Load Balancing"), or have the app reject requests that lack a shared secret header injected by Cloudflare Transform Rules. The public invoker binding itself is correct for a public site; the gap is that the origin is not fenced behind the edge.

### NET-2. No rate limiting or DDoS protection in front of the web app. Severity: Low to Medium. Launch phase: P1.
The MCP service has a courtesy in-process limiter (see AUTH-1); the web app has none. A scraper or flood hits ISR/SSR compute directly. Edge caching plus a rate-limit rule (Cloudflare) is the intended mitigation, and caching is the larger lever: content pages are ISR-cached and change at most daily, so cached hits never wake an instance and cost stays flat under load. Covered by Cloudflare: yes.

## HTTP and transport

### HTTP-1. No HTTP security headers. Severity: Medium. Launch phase: P1.
Nothing in `apps/web/next.config.mjs` or elsewhere sets Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, or a framing control. For a site with an interactive drag widget, add at minimum: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (also limits PII leakage via Referer, see DATA-1), HSTS, and a CSP including `frame-ancestors 'none'` for clickjacking protection. Implement with an `async headers()` block in `next.config.mjs` so it applies at the origin regardless of edge. Partly settable at Cloudflare, but origin-level is more robust.

### HTTP-2. Raw error strings returned to clients. Severity: Low. Launch phase: P2 (MCP-only, deferred with the paused MCP server; see Launch-phase mapping).
`apps/mcp/src/server.ts` returns `String(err)` in the body of `/api/chart` (400) and `/mcp` (500). This can expose internal detail. Log server-side, return a generic message and a request id.

## Input handling and injection

### INPUT-1. Route input is validated against fixed enums. Status: OK (positive). Launch phase: P1.
Dynamic slugs resolve through `pointFromSlug` / `signFromSlug` / `parseAspectSlug`, which return only known enum members or trigger `notFound()`. The single `dangerouslySetInnerHTML` (JSON-LD on the planet-in-sign page) is built from those validated enum values, not raw input, so there is no reflected-injection path. MCP tool inputs are zod-validated ISO datetimes with a 32kb body cap. No SQL, no shell, no filesystem writes from request data.

## Authentication and access

### AUTH-1. MCP rate limiter is weak and evadable. Severity: Medium. Launch phase: P2 (MCP-only, deferred with the paused MCP server).
`app.set('trust proxy', true)` trusts any `X-Forwarded-For`, so a client can rotate that header to get a fresh per-IP bucket and defeat the 120/min limit. Set `trust proxy` to the specific number of proxy hops in front of Cloud Run instead of `true`. Separately, the limiter is in-process and per-instance, and the service scales to 10 instances, so the real ceiling is roughly 10x and resets on cold start. Treat it as a courtesy throttle, not a control. A shared store (or edge rate limiting) is needed for a real limit.

### AUTH-2. No application authentication. Status: acceptable by design. Launch phase: P1.
The product is public read-only; the `allUsers` invoker bindings are intentional. Noted for completeness, not as a defect.

## Data and privacy

### DATA-1. Sensitive birth data serialized into the URL and localStorage. Severity: Medium (High if ads or analytics are added). Launch phase: P2 (see the P1 caveat in Launch-phase mapping: the code has shipped, and if birth-data pages are live alongside P1 ads the leak is present at launch).
`apps/web/components/BirthChart.tsx` persists birth date, time, and place to `localStorage` and serializes them into the URL. Birth date plus place plus time is sensitive personal data. It currently stays client-side with no network transmission, which is good, but URL serialization means it is captured in Cloud Run request logs, saved in browser history, and, if a user shares the URL, disclosed to the recipient. The moment ads or analytics are introduced (contemplated in `docs/ad-monetization-review.md`), the birth data in the URL is sent to those third parties via the `Referer` header. Mitigations: keep birth state out of the query string (use `history.replaceState` with a hash fragment, which is not sent to servers, or keep it purely in localStorage), set `Referrer-Policy` (HTTP-1), and add a short privacy note. There is currently no privacy policy.

### DATA-2. No secrets in the client bundle. Status: OK (positive). Launch phase: P1.
No `NEXT_PUBLIC_*` or `process.env` references leak configuration into client code.

## Secrets management

### SEC-1. No secrets committed; keyless CI. Status: strong (positive). Launch phase: P1.
`git ls-files` shows no tfstate, `.env`, keys, or credentials tracked. `.gitignore` excludes tfstate and provider binaries. `infra/terraform.tfvars` contains only non-secret values (project id, region, repo). CI uses GitHub OIDC exchanged for short-lived GCP credentials via Workload Identity Federation, so there are no long-lived service-account keys anywhere.

## Infrastructure and IAM (GCP)

### IAM-1. Workload Identity Federation is scoped by repository only, not branch. Severity: Low to Medium. Launch phase: P1.
`infra/main.tf` restricts the deployer principal with `attribute.repository == var.github_repo`. Any workflow in that repo (any branch, any PR that runs with `id-token: write`) can therefore impersonate the deployer service account. The deploy jobs are gated on `github.ref == 'refs/heads/main'` and fork PRs do not receive credentials, so exposure is limited, but tightening the WIF attribute condition (or the SA binding) to the `main` branch ref removes the ambient capability. Consider `assertion.ref == 'refs/heads/main'` in the condition.

### IAM-2. Deployer role is broad. Severity: Low. Launch phase: P1.
The deployer holds `roles/run.admin` and `roles/artifactregistry.writer`. `run.admin` is broader than a deploy-only flow strictly needs. Acceptable for a solo project; revisit if more people or repos gain deploy access.

### IAM-3. Least-privilege runtime SA. Status: OK (positive). Launch phase: P1.
The Cloud Run runtime service account is granted no project roles, correct, the app needs no GCP APIs at runtime.

### IAM-4. Terraform remote state not yet enabled. Severity: Low. Launch phase: P1.
The GCS backend is commented out, so state is local. State here holds no high-value secrets, but enabling the remote backend (with versioning and access control) is best practice before the project grows.

## CI/CD and supply chain

### CICD-1. No dependency vulnerability scanning. Severity: Medium (hygiene). Launch phase: P1.
CI runs `npm ci --no-audit`, and there is no Dependabot, `npm audit`, or other SCA in the pipeline. Dependencies are minimal and reputable today (next, react, express, zod, MCP SDK, astronomy-engine), but nothing will flag a future advisory. Add Dependabot or a scheduled `npm audit` / SCA job.

### CICD-2. GitHub Actions pinned to mutable tags. Severity: Low to Medium. Launch phase: P1.
Actions are referenced as `@v4` / `@v2`. Tags can be re-pointed by the action owner or an attacker who compromises the repo. Pin to full commit SHAs for supply-chain integrity.

### CICD-3. Container base images unpinned. Severity: Low. Launch phase: P1.
Both Dockerfiles use `node:22-slim` with no digest. Pin to a `@sha256:` digest for reproducible, tamper-evident builds. Enable Artifact Registry vulnerability scanning on pushed images.

### CICD-4. MCP runs TypeScript via tsx in production. Severity: Low to Medium. Launch phase: P2 (MCP-only, deferred with the paused MCP server).
`apps/mcp/Dockerfile` keeps devDependencies and runs `npx tsx src/server.ts` at runtime, enlarging the production runtime surface and slowing cold start. Prefer building to JS and running a production-only install.

## Containers

### CON-1. Non-root, minimal images. Status: OK (positive). Launch phase: P1.
Both containers run as the `node` user; the web image ships Next standalone output only. Good.

## Dependencies

### DEP-1. Minimal, reputable dependency set. Status: OK, with the CICD-1 caveat. Launch phase: P1.
The ephemeris is `astronomy-engine` only, consistent with the repo rule against Swiss Ephemeris. No automated vulnerability monitoring is in place (see CICD-1).

## Prioritized next steps

1. Fence the origin behind the edge before relying on Cloudflare (NET-1), then add caching and a rate-limit rule (NET-2).
2. Add origin security headers via `next.config.mjs` (HTTP-1); this also supports DATA-1.
3. Move birth data out of the URL query string and add a privacy note (DATA-1).
4. Fix `trust proxy` and treat the MCP limiter as courtesy only (AUTH-1). Deferred to P2 with the paused MCP server.
5. Add dependency scanning and pin Actions and base images (CICD-1, CICD-2, CICD-3).
6. Tighten WIF to the main branch ref (IAM-1).

Items 2, 3, 4, and 6 are code and config changes in this repo and do not depend on any edge provider. Items 1 and 5 are the ones an edge and CI tooling address.
