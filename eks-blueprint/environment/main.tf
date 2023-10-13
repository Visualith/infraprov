provider "aws" {
  region = local.region
  access_key = var.AWS_ACCESS_KEY_ID
  secret_key = var.AWS_SECRET_ACCESS_KEY
    assume_role {
      role_arn     = var.aws_role_arn
      session_name = "visualith-session"
      external_id  = var.aws_external_id
    }
}

data "aws_availability_zones" "available" {}

locals {
  name   = var.environment_name
  region = var.aws_region

  vpc_cidr       = "10.0.0.0/16"
  num_of_subnets = min(length(data.aws_availability_zones.available.names), 3)
  azs            = slice(data.aws_availability_zones.available.names, 0, local.num_of_subnets)

  /* argocd_secret_manager_name = var.argocd_secret_manager_name_suffix */
                                
  tags = {
    Blueprint  = local.name
    GithubRepo = "github.com/aws-ia/terraform-aws-eks-blueprints"
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0.0"

  name = local.name
  cidr = local.vpc_cidr

  azs             = local.azs
  public_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 6, k)]
  private_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 6, k + 10)]

  enable_nat_gateway   = true
  create_igw           = true
  enable_dns_hostnames = true
  single_nat_gateway   = true

  manage_default_network_acl    = true
  default_network_acl_tags      = { Name = "${local.name}-default" }
  manage_default_route_table    = true
  default_route_table_tags      = { Name = "${local.name}-default" }
  manage_default_security_group = true
  default_security_group_tags   = { Name = "${local.name}-default" }

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = local.tags

}

#---------------------------------------------------------------
# ArgoCD Admin Password credentials with Secrets Manager
# Login to AWS Secrets manager with the same role as Terraform to extract the ArgoCD admin password with the secret name as "argocd"
#---------------------------------------------------------------
/* resource "random_password" "argocd" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

#tfsec:ignore:aws-ssm-secret-use-customer-key
resource "aws_secretsmanager_secret" "argocd" {
  name                    = "${local.argocd_secret_manager_name}.${local.name}"
  recovery_window_in_days = "0" # Set to zero for this example to force delete during Terraform destroy
}

resource "aws_secretsmanager_secret_version" "argocd" {
  secret_id     = aws_secretsmanager_secret.argocd.id
  secret_string = random_password.argocd.result
} */


/* Comment the below code */
# Find the user currently in use by AWS
data "aws_caller_identity" "current" {}

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.3"

  name               = "${local.name}-alb"
  load_balancer_type = "application"

  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  #security_groups = [module.vpc.default_security_group_id]
  security_group_rules = {
    ingress_all_http = {
      type        = "ingress"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      description = "HTTP web traffic"
      cidr_blocks = ["0.0.0.0/0"]
    }
    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      #cidr_blocks = [for s in module.vpc.private_subnets_cidr_blocks : s.cidr_block]
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  http_tcp_listeners = [
    {
      port                = "80"
      protocol            = "HTTP"
      action_type         = "forward"
    },
  ]

  target_groups = [
    {
      name                    = "${local.name}-tg-blue"
      backend_protocol        = "HTTP"
      backend_port            = "80"
      target_type             = "ip"
      deregistration_delay    = 10      
      health_check = {
        path    = "/healthz"
        port    = "80"
        matcher = "200-299"
      }
    },
    {
      name                    = "${local.name}-tg-green"
      backend_protocol        = "HTTP"
      backend_port            = "80"
      target_type             = "ip"
      deregistration_delay    = 10      
      health_check = {
        path    = "/healthz"
        port    = "80"
        matcher = "200-299"
      }
    },    
  ]

  http_tcp_listener_rules = [
    {
      actions = [{
        type = "weighted-forward"
        target_groups = [
          {
            target_group_index = 0
            weight             = 100
          },
          {
            target_group_index = 1
            weight             = 0
          }
        ]
        stickiness = {
          enabled  = true
          duration = 3600
        }
      }]

      conditions = [{
        path_patterns = ["/*"]
      }]
    }
  ]

  tags = local.tags
}



