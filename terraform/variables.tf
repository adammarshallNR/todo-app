# --- AWS ---

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "bucket_name" {
  description = "Globally unique S3 bucket name for the static website"
  type        = string
}

# --- GitHub ---

variable "github_owner" {
  description = "GitHub owner / organisation"
  type        = string
  default     = "adammarshallNR"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "todo-app"
}

# --- IP allowlist ---

variable "local_ip" {
  description = "Your local IPv4 address (without CIDR suffix). If null, auto-detected via checkip.amazonaws.com."
  type        = string
  default     = null
}

# --- AWS credentials to push as GitHub Actions secrets ---
# Populate these by exporting TF_VAR_* env vars before running terraform:
#   export TF_VAR_aws_access_key_id=$AWS_ACCESS_KEY_ID
#   export TF_VAR_aws_secret_access_key=$AWS_SECRET_ACCESS_KEY
#   export TF_VAR_aws_session_token=$AWS_SESSION_TOKEN  (if required)

variable "aws_access_key_id" {
  description = "AWS access key ID to store as a GitHub Actions secret"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key to store as a GitHub Actions secret"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS session token to store as a GitHub Actions secret (optional — note: session tokens expire)"
  type        = string
  sensitive   = true
  default     = null
}

# --- Other secrets sourced from local env vars (TF_VAR_*) ---

variable "new_relic_license_key" {
  description = "New Relic ingest licence key (set via TF_VAR_new_relic_license_key)"
  type        = string
  sensitive   = true
  default     = null
}

variable "squad_owner" {
  description = "Squad/team owner label used in Playwright tests (set via TF_VAR_squad_owner)"
  type        = string
  default     = null
}
