# Auto-detect the caller's public IP if local_ip variable is not set
data "http" "my_ip" {
  url = "https://checkip.amazonaws.com"
}

locals {
  local_ip_cidr = var.local_ip != null ? "${var.local_ip}/32" : "${chomp(data.http.my_ip.response_body)}/32"
}

# Fetch GitHub Actions IP ranges
data "github_ip_ranges" "main" {}

resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name

  tags = {
    Project = var.github_repo
    ManagedBy = "terraform"
  }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA fallback
  }
}

# Allow public access so the static site is reachable
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  # Must wait for the public access block to be removed first
  depends_on = [aws_s3_bucket_public_access_block.website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Anyone can read objects (static website)
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      },
      # Only GitHub Actions runners and the deployer's local machine can upload
      {
        Sid    = "RestrictedWriteAccess"
        Effect = "Deny"
        Principal = "*"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*",
        ]
        Condition = {
          NotIpAddress = {
            "aws:SourceIp" = concat(
              data.github_ip_ranges.main.actions,
              [local.local_ip_cidr]
            )
          }
        }
      },
    ]
  })
}
