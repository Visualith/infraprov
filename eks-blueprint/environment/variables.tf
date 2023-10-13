variable "environment_name" {
  description = "The name of environment Infrastructure stack."
  type        = string
}

variable "bucket_name" {
  description = "The name of S3 bucket."
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "session_name" {
  description = "Session Name for role ARN"
  type        = string
  default     = "cool_customer"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

/* variable "argocd_secret_manager_name_suffix" {
  type        = string
  description = "Name of secret manager secret for ArgoCD Admin UI Password"
  default     = "argocd-admin-secret"
} */

 variable "aws_role_arn" {
  type = string
}

variable "aws_external_id" {
  type = string
}

variable "AWS_ACCESS_KEY_ID" {
  type = string
}

variable "AWS_SECRET_ACCESS_KEY" {
  type = string
}
