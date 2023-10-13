terraform {
  required_version = ">= 1.4.0"

    /* backend "s3" {
      bucket = var.bucket_name
      key    = "terraform.tfstate"
      region = var.aws_region
  } */

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}
