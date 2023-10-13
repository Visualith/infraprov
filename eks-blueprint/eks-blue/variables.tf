variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "environment_name" {
  description = "The name of Environment Infrastructure stack name, feel free to rename it. Used for cluster and VPC names."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "eks_admin_role_name" {
  type        = string
  description = "Additional IAM role to be admin in the cluster"
  default     = "cool_customer"
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

variable "session_name" {
  description = "Session Name for role ARN"
  type        = string
  default     = ""
}

variable "bucket_name" {
  description = "The name of S3 bucket."
  type        = string
}
variable "workload_repo_url" {
  type        = string
  description = "Git repo URL for the ArgoCD workload deployment"
  default     = "https://github.com/Visualith/eks-blueprints-workloads.git"
}

variable "workload_repo_secret" {
  type        = string
  description = "Secret Manager secret name for hosting Github SSH-Key to Access private repository"
  default     = "github-blueprint-ssh-key"
}

variable "workload_repo_revision" {
  type        = string
  description = "Git repo revision in workload_repo_url for the ArgoCD workload deployment"
  default     = "main"
}
variable "profile_name" {
  type        = string
  description = "Profile Name AWS"
}

variable "workload_repo_path" {
  type        = string
  description = "Git repo path in workload_repo_url for the ArgoCD workload deployment"
  default     = "envs/dev"
}

variable "addons_repo_url" {
  type        = string
  description = "Git repo URL for the ArgoCD addons deployment"
  default     = "https://github.com/Visualith/eks-blueprints-add-ons.git"
}

variable "instance_type"{
  description = "Type of EC2 instance"
  type = string
}

variable "min_size"{
  description = "Type of EC2 instance"
  type = string
}

variable "max_size"{
  description = "Type of EC2 instance"
  type = string
}

variable "disk_size"{
  description = "Disk Size"
  type = string
}

