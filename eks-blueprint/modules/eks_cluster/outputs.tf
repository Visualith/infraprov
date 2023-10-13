output "eks_cluster_id" {
  description = "The name of the EKS cluster."
  value       = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${var.aws_region}  update-kubeconfig --name ${module.eks.cluster_name}"
}

output "eks_cluster_endpoint" {
  description = "The endpoint of the EKS cluster."
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "cluster_certificate_authority_data"
  value       = module.eks.cluster_certificate_authority_data
}


output "admin_team" {
  description = "Configure kubectl for Platform Team: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${var.aws_region}  update-kubeconfig --name ${module.eks.cluster_name} --role-arn ${module.admin_team.iam_role_arn}"
}

/* output "development_team" {
  description = "Configure kubectl for each Dev Application Teams: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = [for team in module.development_team : "aws eks --region ${var.aws_region} update-kubeconfig --name ${module.eks.cluster_name} --role-arn ${team.iam_role_arn}"]
} */

