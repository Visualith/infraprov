provider "aws" {
  region = var.aws_region
  access_key = var.AWS_ACCESS_KEY_ID
  secret_key = var.AWS_SECRET_ACCESS_KEY
  profile = var.profile_name
    assume_role {
      role_arn     = var.aws_role_arn
      session_name = "visualith-session"
      external_id  = var.aws_external_id
    }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks_cluster.eks_cluster_id
}


provider "kubernetes" {
  host                   = module.eks_cluster.eks_cluster_endpoint
  token                  = data.aws_eks_cluster_auth.cluster.token 
  cluster_ca_certificate = base64decode(module.eks_cluster.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = ["eks", "get-token", "--cluster-name", module.eks_cluster.eks_cluster_id]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks_cluster.eks_cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_cluster.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token 

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = ["eks", "get-token", "--cluster-name", module.eks_cluster.eks_cluster_id]
    }
  }
}

provider "kubectl" {
  apply_retry_count      = 10
  host                   = module.eks_cluster.eks_cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_cluster.cluster_certificate_authority_data)
  load_config_file       = false
   token                  = data.aws_eks_cluster_auth.cluster.token 

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = ["eks", "get-token", "--cluster-name", module.eks_cluster.eks_cluster_id]
  }
}

data "aws_eks_cluster_auth" "this" {
  name = module.eks_cluster.eks_cluster_id
}

module "eks_cluster" {
  source = "../modules/eks_cluster"

  aws_region      = var.aws_region
  service_name    = "blue"
  cluster_version = "1.28"

  environment_name       = var.environment_name
  profile_name           = var.profile_name
  eks_admin_role_name    = var.eks_admin_role_name
  aws_role_arn             = var.aws_role_arn
  AWS_ACCESS_KEY_ID        = var.AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY    = var.AWS_SECRET_ACCESS_KEY
  bucket_name              = var.bucket_name
  aws_external_id          = var.aws_external_id
  instance_type            = var.instance_type
  min_size                 = var.min_size
  max_size                 = var.max_size
  disk_size                = var.disk_size


  /* argocd_secret_manager_name_suffix =  var.argocd_secret_manager_name_suffix */

  addons_repo_url = var.addons_repo_url 

  workload_repo_url      = var.workload_repo_url
  workload_repo_revision = var.workload_repo_revision
  workload_repo_path     = var.workload_repo_path

}

