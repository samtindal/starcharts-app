# Starcharts | Firebase App Hosting Migration Runbook

Date: 2026-07-12. The web app moved from a hand-built Cloud Run + Terraform + GitHub Actions deploy to **Firebase App Hosting**, which builds and serves the Next.js SSR/ISR app on managed Cloud Run behind Google's CDN. The MCP server stays deferred out of v1 and is not hosted here. Edge decision (2026-07-12): **Cloudflare proxied in front** of App Hosting, with edge caching on the content routes, so egress stays near $0 and you get Bot Fight plus a rate-limit rule. This reactivates origin fencing (security-audit NET-1): the App Hosting origin should reject traffic that bypasses Cloudflare.

## What already changed in the repo

- `apps/web/apphosting.yaml`: App Hosting runtime config (scale to zero, cpu/memory/concurrency).
- `apps/web/next.config.mjs`: removed `output: 'standalone'` (App Hosting wraps the standard Next build).
- `.firebaserc`: default project set to `massive-pen-501722-m4` (the existing GCP project; add Firebase to it).
- Retired: `infra/` (all Terraform), `apps/web/Dockerfile`, `apps/mcp/Dockerfile`, and `.github/workflows/deploy.yml`.
- `.github/workflows/ci.yml`: tests only (typecheck + `npm test`); App Hosting owns deploys.

## Steps you run (console + CLI, one-time)

These need a human: Firebase project creation, billing, and GitHub authorization are interactive.

1. **Add Firebase to the existing GCP project.** In the [Firebase console](https://console.firebase.google.com), "Add project" and select the existing Google Cloud project `massive-pen-501722-m4` so Firebase and the current project are the same. (This keeps one project and one bill.)

2. **Enable Blaze.** App Hosting requires the pay-as-you-go Blaze plan (it has free allowances; you only pay past them). Set a **budget alert** (for example at $20 and $75/month) while you learn real traffic.

3. **Install / update the CLI and log in.**
   ```bash
   npm i -g firebase-tools
   firebase login
   ```

4. **Create the App Hosting backend and connect GitHub.**
   ```bash
   cd ~/Claude/Projects/astrology-clock
   firebase apphosting:backends:create --project massive-pen-501722-m4
   ```
   During the prompts:
   - Authorize the Firebase GitHub app and select the repo (`samtindal/starcharts-app`).
   - **Root directory: `apps/web`** (this is a monorepo; the backend builds from there and reads `apps/web/apphosting.yaml`).
   - **Live branch: `main`** (every push to main triggers a build + rollout).
   - Region: `us-central1` (matches the old setup and the Always-Free storage region).

5. **First rollout.** Push to `main` (or trigger a rollout from the console). App Hosting runs `next build`, deploys to managed Cloud Run, and serves it behind its CDN. Watch the **Rollouts** tab; grab the generated `*.web.app` / App Hosting URL and smoke-test `/`, an aspect page, and `/sitemap.xml`.

6. **Custom domain (starcharts.me) with Cloudflare in front.**
   a. In App Hosting, add the custom domain and note the DNS records it prints.
   b. In Cloudflare DNS, add those records **DNS-only (gray cloud)** first, so Google can issue the managed origin cert (~15 min). Confirm `https://starcharts.me` serves.
   c. Flip the record to **proxied (orange cloud)** and set Cloudflare SSL/TLS mode to **Full (strict)** so the edge validates the App Hosting origin cert.
   d. Add a Cloudflare **Cache Rule** for `/aspects/*`, `/signs/*`, `/planets/*`, `/sky`, `/moon`: make them cache-eligible and **respect origin Cache-Control** (Next ISR already emits `s-maxage` / `stale-while-revalidate`, so the edge expires in step with your revalidate windows). Leave `/` (the live clock) **bypassed**.
   e. Turn on **Bot Fight Mode** and, optionally, one **rate-limiting rule** on the content routes. Verify Googlebot and link unfurlers are not challenged (you want crawlers allowed, per the SEO/AI-bot stance).
   f. **Origin fence (NET-1), recommended.** So nobody bypasses Cloudflare by hitting the raw App Hosting URL, add a Cloudflare **Transform Rule** injecting a secret request header, and reject requests missing it in a small `apps/web/middleware.ts` (compare against a secret from App Hosting env / Secret Manager). This needs a secret and a middleware; treat it as a fast-follow, not a launch blocker. Ask and I can implement it.

7. **Env vars / secrets (when E1 ads land).** Non-secret values go in `apphosting.yaml` under `env:`. Secrets go through Cloud Secret Manager and are referenced with `secret:` in `apphosting.yaml`; grant the App Hosting service account access. Nothing secret is needed for the current build.

## Notes

- No more Terraform, Dockerfiles, Workload Identity Federation, Artifact Registry, or self-managed deploy YAML: App Hosting manages the Cloud Run service, the build (Cloud Build), and the image for you. That removes the IAM/CI/container hardening items that assumed a self-owned pipeline (see the supersession note in `docs/security-audit.md`).
- Security headers still belong in `apps/web/next.config.mjs` via an `async headers()` block (hardening spec B1); App Hosting serves them unchanged.
- Rollback: App Hosting keeps previous rollouts; roll back from the console's Rollouts tab.
- Cost expectation: with Cloudflare proxied in front, cached content is served from Cloudflare's free edge, so App Hosting egress stays near $0 even at ~1M visits (you pay only origin cache-fill and SSR requests, a few dollars). Without Cloudflare it would be ~$65/month egress at that traffic. The trade is a bit of ongoing edge maintenance (cache-rule upkeep, purge-on-deploy discipline, watching bot rules do not block crawlers).
