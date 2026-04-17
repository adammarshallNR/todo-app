output "website_url" {
  description = "S3 static website endpoint"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.id
}

output "deployer_ip_detected" {
  description = "Local IP address detected and added to the allowlist"
  value       = local.local_ip_cidr
}
