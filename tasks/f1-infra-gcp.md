# F1 — Infra (GCP) ✅ (phase 1)

**Delivered:** `infra/` Terraform — Cloud Run (mcp live, web gated on `web_image` var), Artifact Registry, runtime + deployer service accounts, GitHub WIF (keyless CI). `.github/workflows/deploy.yml` — test → build → push → deploy → smoke test. `apps/mcp/Dockerfile`.

**Bootstrap:** see `infra/README.md` (terraform apply + 3 GitHub secrets).

**Phase 2 (when web app ships):** set `web_image`, add web deploy job mirroring the mcp one, custom domain mapping + managed cert, LB + Cloud CDN for content pages, Cloud Armor rate-limit policy on /mcp, uptime checks + alerting.
