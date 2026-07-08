# Starcharts on GCP

Architecture: two Cloud Run services (scale-to-zero) + Artifact Registry,
deployed from GitHub Actions via Workload Identity Federation — **no
service-account keys exist anywhere**. Later phases add a global HTTPS load
balancer + Cloud CDN in front of the web service for SEO-page caching, and
Cloud Armor rate limiting on the MCP free tier (see PLAN.md §6).

Production project: **massive-pen-501722-m4** (number 924692831030). Domain: **starcharts.me**, DNS on Cloudflare.

## One-time bootstrap

```bash
# prerequisites: billing enabled on massive-pen-501722-m4; gcloud auth login done
cd infra
# fill in github_repo in terraform.tfvars first
terraform init
terraform apply   # project_id/region are already in terraform.tfvars
```

Then set three GitHub Actions secrets from the terraform outputs:

| Secret | Value |
|---|---|
| `GCP_PROJECT_ID` | your project id |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | output `workload_identity_provider` |
| `GCP_SERVICE_ACCOUNT` | output `deployer_service_account` |

Every push to `main` then: tests → builds BOTH images (web + mcp) → deploys
to Cloud Run → smoke-tests each. The first terraform apply deploys a
placeholder MCP image; the first CI run replaces it and creates the
`starcharts-web` service.

## Domain: starcharts.me via Cloudflare (no load balancer needed)

1. After the first web deploy, map the domain (free, no LB):
   ```bash
   gcloud beta run domain-mappings create \
     --service starcharts-web --domain starcharts.me \
     --region us-central1 --project massive-pen-501722-m4
   ```
   It prints DNS records to add.
2. In Cloudflare DNS: add the printed CNAME/A records with the cloud **gray**
   (DNS-only) so Google can issue the managed certificate (takes ~15 min).
3. Once https://starcharts.me serves, flip the record to **proxied** (orange
   cloud) to get Cloudflare's edge cache/DDoS in front. If TLS errors appear,
   set Cloudflare SSL mode to "Full (strict)".
4. Optional but recommended: a Cloudflare Cache Rule to cache
   `/aspects/*`, `/signs/*`, `/planets/*` (they're the same for everyone;
   respect origin cache headers) and leave `/` uncached (it's the live clock).

## Costs

Cloud Run at min-instances 0 bills only per-request; a prototype-stage app
costs pennies. When traffic justifies it, set `min_instance_count = 1` on
the web service to remove cold starts (~$10–15/mo) before chasing CWV
scores for SEO.

## State

Local state to start. Before collaborating or wiring CD for infra, create a
GCS bucket and uncomment the `backend "gcs"` block in `main.tf`, then
`terraform init -migrate-state`.
