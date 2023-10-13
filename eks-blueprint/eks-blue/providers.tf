terraform {
  required_version = ">= 1.4.0"
    backend "s3" {
      bucket = var.bucket_name
      key    = "terraform.tfstate"
      region = var.aws_region
      dynamodb_table = "terraform-state" 
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.20.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.9.0"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.14"
    }
  }
}

