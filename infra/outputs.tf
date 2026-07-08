output "mcp_url" {
  value       = google_cloud_run_v2_service.mcp.uri
  description = "Public URL of the MCP server"
}

output "web_url" {
  value       = length(google_cloud_run_v2_service.web) > 0 ? google_cloud_run_v2_service.web[0].uri : null
  description = "Public URL of the web app (null until web_image is set)"
}

output "artifact_repo" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.starcharts.repository_id}"
  description = "Docker repo prefix for image pushes"
}

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Set as GitHub secret GCP_WORKLOAD_IDENTITY_PROVIDER"
}

output "deployer_service_account" {
  value       = google_service_account.deployer.email
  description = "Set as GitHub secret GCP_SERVICE_ACCOUNT"
}
