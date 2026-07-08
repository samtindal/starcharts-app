terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
  # After first apply, create a GCS bucket for state and uncomment:
  # backend "gcs" {
  #   bucket = "<project>-tfstate"
  #   prefix = "starcharts"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ---------- APIs ----------
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# ---------- Artifact Registry ----------
resource "google_artifact_registry_repository" "starcharts" {
  repository_id = "starcharts"
  location      = var.region
  format        = "DOCKER"
  description   = "Starcharts container images"
  depends_on    = [google_project_service.apis]
}

# ---------- Runtime service account (least privilege: none needed yet) ----------
resource "google_service_account" "run" {
  account_id   = "starcharts-run"
  display_name = "Starcharts Cloud Run runtime"
}

# ---------- MCP server ----------
resource "google_cloud_run_v2_service" "mcp" {
  name     = "starcharts-mcp"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run.email
    scaling {
      min_instance_count = 0 # scale to zero: ≈ $0 until traffic arrives
      max_instance_count = 10
    }
    containers {
      image = var.mcp_image
      ports {
        container_port = 8080
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  # CI deploys new revisions with gcloud; don't let terraform fight it.
  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }
  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service_iam_member" "mcp_public" {
  name     = google_cloud_run_v2_service.mcp.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- Web app (created once web_image is set) ----------
resource "google_cloud_run_v2_service" "web" {
  count    = var.web_image == "" ? 0 : 1
  name     = "starcharts-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run.email
    scaling {
      min_instance_count = 0
      max_instance_count = 20
    }
    containers {
      image = var.web_image
      ports {
        container_port = 3000
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }
  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  count    = var.web_image == "" ? 0 : 1
  name     = google_cloud_run_v2_service.web[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- GitHub Actions → GCP via Workload Identity Federation ----------
# No service-account keys anywhere: GitHub's OIDC token is exchanged for
# short-lived GCP credentials, restricted to this one repository.
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  attribute_condition = "assertion.repository == \"${var.github_repo}\""
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deployer" {
  account_id   = "starcharts-deployer"
  display_name = "Starcharts CI deployer"
}

resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

resource "google_project_iam_member" "deployer_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.writer",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Deployer must be able to act as the runtime SA when deploying revisions.
resource "google_service_account_iam_member" "deployer_actas" {
  service_account_id = google_service_account.run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
