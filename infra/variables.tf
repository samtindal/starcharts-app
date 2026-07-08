variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Region for Cloud Run and Artifact Registry"
  type        = string
  default     = "us-central1"
}

variable "github_repo" {
  description = "GitHub repository allowed to deploy, as owner/repo (e.g. samtindal/starcharts)"
  type        = string
}

variable "mcp_image" {
  description = "Container image for the MCP server. Placeholder until first CI push."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "web_image" {
  description = "Container image for the Next.js web app. Empty = don't create the service yet."
  type        = string
  default     = ""
}
