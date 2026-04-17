data "github_repository" "repo" {
  name = var.github_repo
}

# --- AWS credentials (sourced from executor's local env vars) ---

resource "github_actions_secret" "aws_access_key_id" {
  repository      = data.github_repository.repo.name
  secret_name     = "AWS_ACCESS_KEY_ID"
  plaintext_value = var.aws_access_key_id
}

resource "github_actions_secret" "aws_secret_access_key" {
  repository      = data.github_repository.repo.name
  secret_name     = "AWS_SECRET_ACCESS_KEY"
  plaintext_value = var.aws_secret_access_key
}

# Session token is optional — the workflow has this commented out.
# Only set if your GitHub Actions role requires it.
# WARNING: session tokens expire; ensure you re-run `terraform apply` to rotate.
resource "github_actions_secret" "aws_session_token" {
  count = var.aws_session_token != null ? 1 : 0

  repository      = data.github_repository.repo.name
  secret_name     = "AWS_SESSION_TOKEN"
  plaintext_value = var.aws_session_token
}

resource "github_actions_secret" "aws_s3_bucket" {
  repository      = data.github_repository.repo.name
  secret_name     = "AWS_S3_BUCKET"
  plaintext_value = aws_s3_bucket.website.id
}

# --- Optional secrets ---

resource "github_actions_secret" "new_relic_license_key" {
  count = var.new_relic_license_key != null ? 1 : 0

  repository      = data.github_repository.repo.name
  secret_name     = "NEW_RELIC_LICENSE_KEY"
  plaintext_value = var.new_relic_license_key
}

resource "github_actions_secret" "squad_owner" {
  count = var.squad_owner != null ? 1 : 0

  repository      = data.github_repository.repo.name
  secret_name     = "SQUAD_OWNER"
  plaintext_value = var.squad_owner
}
