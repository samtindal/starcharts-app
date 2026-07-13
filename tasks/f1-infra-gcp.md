# F1 | Hosting (Firebase App Hosting)

**Updated 2026-07-12: migrated from a hand-built GCP Cloud Run stack to Firebase App Hosting.** The web app is built and served by App Hosting (managed Cloud Run + Google CDN), connected to GitHub so a push to `main` triggers a build and rollout. No Terraform, Dockerfiles, GitHub Actions deploy pipeline, Artifact Registry, or Workload Identity Federation to own.

**In the repo:** `apps/web/apphosting.yaml` (scale-to-zero run config), `.firebaserc` (project `massive-pen-501722-m4`), `next.config.mjs` without `output: 'standalone'`, and `.github/workflows/ci.yml` (tests only). The old `infra/`, both Dockerfiles, and `deploy.yml` were removed.

**Finish (one-time console/CLI steps):** see `docs/firebase-migration-runbook.md`, add Firebase to the existing GCP project, enable Blaze + budget alerts, `firebase apphosting:backends:create` with root directory `apps/web` and live branch `main`, first rollout, then map `starcharts.me` (Cloudflare DNS-only for the managed cert).

**Edge:** Cloudflare proxied in front of App Hosting (chosen 2026-07-12). Proxied DNS + Full (strict) SSL, a cache rule on the content routes respecting ISR TTLs, Bot Fight + one rate-limit rule; egress stays near $0. Reactivates origin fencing (NET-1): fence the App Hosting origin with a Cloudflare Transform Rule secret header rejected in `apps/web/middleware.ts`, so the raw origin URL cannot bypass the edge (fast-follow, not a launch blocker). Steps in the runbook.

**MCP:** deferred out of v1 and not hosted. When it resumes, host it separately (its own App Hosting backend or a small Cloud Run service); do not fold it into the web backend.

**Retired (historical):** the previous delivery was `infra/` Terraform (Cloud Run, Artifact Registry, runtime + deployer service accounts, GitHub WIF keyless CI) plus a build/push/deploy/smoke-test GitHub Actions workflow. Recoverable from git history if ever needed.
