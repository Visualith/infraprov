# Required for public ECR where Karpenter artifacts are hosted
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

data "aws_partition" "current" {}

# Find the user currently in use by AWS
data "aws_caller_identity" "current" {}

data "aws_vpc" "vpc" {
  filter {
    name   = "tag:Name"
    values = [local.tag_val_vpc]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "tag:Name"
    values = ["${local.tag_val_private_subnet}*"]
  }
}

#Add Tags for the new cluster in the VPC Subnets
resource "aws_ec2_tag" "private_subnets" {
  for_each    = toset(data.aws_subnets.private.ids)
  resource_id = each.value
  key         = "kubernetes.io/cluster/${local.environment}-${local.service}"
  value       = "shared"
}

data "aws_subnets" "public" {
  filter {
    name   = "tag:Name"
    values = ["${local.tag_val_public_subnet}*"]
  }
}

#Add Tags for the new cluster in the VPC Subnets
resource "aws_ec2_tag" "public_subnets" {
  for_each    = toset(data.aws_subnets.public.ids)
  resource_id = each.value
  key         = "kubernetes.io/cluster/${local.environment}-${local.service}"
  value       = "shared"
}
/* data "aws_secretsmanager_secret" "argocd" {
  name = "${local.argocd_secret_manager_name}.${local.environment}"
} */

/* data "aws_secretsmanager_secret_version" "admin_password_version" {
  secret_id = data.aws_secretsmanager_secret.argocd.id
} */
#tfsec:ignore:aws-eks-enable-control-plane-logging
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.16.0"

  cluster_name                   = local.name
  cluster_version                = local.cluster_version
  cluster_endpoint_public_access = true

  vpc_id     = data.aws_vpc.vpc.id
  subnet_ids = data.aws_subnets.private.ids

  /* create_aws_auth_configmap = true */


  cluster_addons_timeouts = {
    create = "120m"
    update = "120m"
    delete = "60m"
  }

  cluster_timeouts = {
    create = "120m"
    update = "120m"
    delete = "60m"
  } 

  #we uses only 1 security group to allow connection with Fargate, MNG, and Karpenter nodes

  create_node_security_group = false

  cluster_security_group_additional_rules = {   
    ingress_alb_security_group_id = {
      description              = "Ingress from environment ALB security group"
      protocol                 = "tcp"
      from_port                = 80
      to_port                  = 80
      type                     = "ingress"
      source_security_group_id = data.aws_security_group.alb_sg[0].id
    }
  }

 

  eks_managed_node_groups = {
    initial = {
      node_group_name = local.node_group_name
      instance_types  = [local.instance_type]
      disk_size    = tonumber(local.disk_size)
      min_size     = tonumber(local.min_size)
      max_size     = tonumber(local.max_size)
      desired_size = tonumber((local.min_size + local.max_size) / 2)
      subnet_ids   = data.aws_subnets.private.ids
    }
  }

  manage_aws_auth_configmap = true
  aws_auth_roles = flatten([
    module.admin_team.aws_auth_configmap_role,
    /* [for team in module.development_team : team.aws_auth_configmap_role], */
    /* {
      rolearn  = module.eks_blueprints_addons.karpenter.node_iam_role_arn
      username = "system:node:{{EC2PrivateDNSName}}"
      groups = [
        "system:bootstrappers",
        "system:nodes",
      ]
    }, */
    {
      rolearn  = "arn:aws:iam::497436922804:role/cool_customer" # The ARN of the IAM role
      username = "ops-role"                                                                                  # The user name within Kubernetes to map to the IAM role */
      groups   = ["system:masters"]                                                                              # A list of groups within Kubernetes to which the role is mapped; Checkout K8s Role and Rolebindings
    }
  ])

  /* tags = merge(local.tags, {
    # NOTE - if creating multiple security groups with this module, only tag the
    # security group that Karpenter should utilize with the following tag
    # (i.e. - at most, only one security group should have this tag in your account)
    "karpenter.sh/discovery" = "${local.environment}-${local.service}"
  }) */
}


data "aws_iam_role" "eks_admin_role_name" {
  count     = local.eks_admin_role_name != "" ? 1 : 0
  name = local.eks_admin_role_name
}

module "admin_team" {
  source  = "aws-ia/eks-blueprints-teams/aws"
  version = "~> 1.0.0"

  name = "team-platform"

  # Enables elevated, admin privileges for this team
  enable_admin = true

  /* depends_on = [module.eks] */
 
  # Define who can impersonate the team-platform Role
  users             = [
    data.aws_caller_identity.current.arn,
    try(data.aws_iam_role.eks_admin_role_name[0].arn, data.aws_caller_identity.current.arn),
  ]
  cluster_arn       = module.eks.cluster_arn
  oidc_provider_arn = module.eks.oidc_provider_arn

  labels = {
    "elbv2.k8s.aws/pod-readiness-gate-inject" = "enabled",
    "appName"                                 = "platform-team-app",
    "projectName"                             = "project-platform",
  }

  annotations = {
    team = "platform"
  }

  namespaces = {
    "team-platform" = {

      resource_quota = {
        hard = {
          "requests.cpu"    = "10000m",
          "requests.memory" = "20Gi",
          "limits.cpu"      = "20000m",
          "limits.memory"   = "50Gi",
          "pods"            = "20",
          "secrets"         = "20",
          "services"        = "20"
        }
      }

      limit_range = {
        limit = [
          {
            type = "Pod"
            max = {
              cpu    = "2000m"
              memory = "2Gi"
            },
            min = {
              cpu    = "10m"
              memory = "4Mi"
            }
          },
          {
            type = "PersistentVolumeClaim"
            min = {
              storage = "24M"
            }
          }
        ]
      }
    }

  }

  tags = local.tags
}


/* module "development_team" {
  source  = "aws-ia/eks-blueprints-teams/aws"
  version = "~> 1.0.0"

  for_each = {
    burnham = {
      labels = {
        "elbv2.k8s.aws/pod-readiness-gate-inject" = "enabled",
        "appName"                                 = "burnham-team-app",
        "projectName"                             = "project-burnham",
      }
    }
    riker = {
      labels = {
        "elbv2.k8s.aws/pod-readiness-gate-inject" = "enabled",
        "appName"                                 = "riker-team-app",
        "projectName"                             = "project-riker",
      }
    }
  }
  name = "team-${each.key}"

  users             = [data.aws_caller_identity.current.arn]
  cluster_arn       = module.eks.cluster_arn
  oidc_provider_arn = module.eks.oidc_provider_arn

  labels = merge(
    {
      team = each.key
    },
    try(each.value.labels, {})
  )

  annotations = {
    team = each.key
  }

  namespaces = {
    "team-${each.key}" = {
      labels = merge(
        {
          team = each.key
        },
        try(each.value.labels, {})
      )

      resource_quota = {
        hard = {
          "requests.cpu"    = "100",
          "requests.memory" = "20Gi",
          "limits.cpu"      = "200",
          "limits.memory"   = "50Gi",
          "pods"            = "15",
          "secrets"         = "10",
          "services"        = "20"
        }
      }

      limit_range = {
        limit = [
          {
            type = "Pod"
            max = {
              cpu    = "2"
              memory = "1Gi"
            }
            min = {
              cpu    = "10m"
              memory = "4Mi"
            }
          },
          {
            type = "PersistentVolumeClaim"
            min = {
              storage = "24M"
            }
          },
          {
            type = "Container"
            default = {
              cpu    = "50m"
              memory = "24Mi"
            }
          }
        ]
      }
    }
  }

  tags = local.tags

} */

module "ebs_csi_driver_irsa" {
    source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
    version = "~> 5.30"

    role_name_prefix = "${local.name}-ebs-csi-driver-"
    allow_self_assume_role = true

    attach_ebs_csi_policy = true

    oidc_providers = {
      main = {
        provider_arn               = module.eks.oidc_provider_arn
        namespace_service_accounts = ["kube-system:ebs-csi-controller-sa","kubecost:kubecost-cost-analyzer", "kubecost:kubecost-prometheus-server"]
      }
    }

    tags = local.tags
  }

module "eks_blueprints_addons" {
  source = "aws-ia/eks-blueprints-addons/aws"
  version = "~> 1.9.2" #ensure to update this to the latest/desired version

  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = "1.28"
  oidc_provider_arn = module.eks.oidc_provider_arn
  /* enable_karpenter = true */

  enable_argocd         = true
    
    argocd = {
      name             = "argo-cd"
      chart            = "argo-cd"
      repository       = "https://argoproj.github.io/argo-helm"
      version          = "2.8.4"
      namespace        = "argocd"
      timeout          = "3600"
      create_namespace = true
      values           = [templatefile("${path.module}/values.yaml", {})]
    }

    /* argocd_helm_config = {
      set_sensitive = [
        {
          name  = "configs.secret.argocdServerAdminPassword"
          value = bcrypt(data.aws_secretsmanager_secret_version.admin_password_version.secret_string)
        }
      ]    
      set = [
        {
          name  = "server.service.type"
          value = "LoadBalancer"
        }
      ]
    } */
  

  eks_addons = {
    aws-ebs-csi-driver = {
       most_recent              = true
       service_account_role_arn = module.ebs_csi_driver_irsa.iam_role_arn 
    }
    coredns = {
      most_recent = true
    }
     vpc-cni = {
      # Specify the VPC CNI addon should be deployed before compute to ensure
      # the addon is configured before data plane compute resources are created
      # See README for further details
      service_account_role_arn = module.vpc_cni_irsa.iam_role_arn
      before_compute           = true
      #addon_version  = "v1.12.2-eksbuild.1"
      most_recent = true # To ensure access to the latest settings provided
      configuration_values = jsonencode({
        env = {
          # Reference docs https://docs.aws.amazon.com/eks/latest/userguide/cni-increase-ip-addresses.html
          ENABLE_PREFIX_DELEGATION = "true"
          WARM_PREFIX_TARGET       = "1"
        }
      })
    }
    kube-proxy = {
      most_recent = true
    }
  }

  eks_addons_timeouts = {
    create = "120m"
    update = "120m"
    delete = "60m"
  }

   enable_aws_load_balancer_controller    = true
   enable_kube_prometheus_stack           = true
   enable_metrics_server                  = true
   enable_vpa = true
   enable_ingress_nginx                 = true   
   /* enable_velero = true */
   /* enable_cert_manager                    = true
   enable_external_dns                    = true
   cert_manager_route53_hosted_zone_arns  = ["arn:aws:route53:::hostedzone/XXXXXXXXXXXXX"] */
   aws_load_balancer_controller = {
    set = [{
      name  = "enableServiceMutatorWebhook"
      value = "false"
    }]
  }
   /* enable_aws_gateway_api_controller = true */
   enable_aws_efs_csi_driver           = true
    enable_aws_fsx_csi_driver           = true

   /* kube_prometheus_stack = {
    values = [
      <<-EOT
        prometheus:
          prometheusSpec:
            serviceMonitorSelectorNilUsesHelmValues: false
      EOT
    ]
  } */
enable_cluster_autoscaler  = true
  /* enable_cluster_proportional_autoscaler = true
  enable_karpenter                       = true
  enable_kube_prometheus_stack           = true
  enable_metrics_server                  = true
  enable_external_dns                    = true
  enable_cert_manager                    = true
  cert_manager_route53_hosted_zone_arns  = ["arn:aws:route53:::hostedzone/XXXXXXXXXXXXX"] */
  helm_releases = {
    prometheus-adapter = {
      description      = "A Helm chart for k8s prometheus adapter"
      namespace        = "prometheus-adapter"
      create_namespace = true
      chart            = "prometheus-adapter"
      chart_version    = "4.2.0"
      repository       = "https://prometheus-community.github.io/helm-charts"
      values = [
        <<-EOT
          replicas: 2
          podDisruptionBudget:
            enabled: true
        EOT
      ]
    }
  }

    

  tags = {
    Environment = "dev"
  }
}

resource "aws_security_group_rule" "alb" {
  security_group_id = module.eks.cluster_primary_security_group_id
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  description       = "Ingress from environment ALB security group"
  source_security_group_id = data.aws_security_group.alb_sg[0].id
}

module "vpc_cni_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.20"

  role_name_prefix = "${module.eks.cluster_name}-vpc-cni-"

  attach_vpc_cni_policy = true
  vpc_cni_enable_ipv4   = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-node"]
    }
  }

  tags = local.tags
}