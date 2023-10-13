## Motivation

Kubernetes is a powerful and extensible container orchestration technology that allows you to deploy
and manage containerized applications at scale. The extensible nature of Kubernetes also allows you
to use a wide range of popular open-source tools in Kubernetes clusters. However, With the wide array
of tooling and design choices available, configuring an EKS cluster that meets your organization’s
specific needs can take a significant amount of time. It involves integrating a wide range of
open-source tools and AWS services as well as expertise in AWS and Kubernetes.

AWS customers have asked for patterns that demonstrate how to integrate the landscape of Kubernetes
tools and make it easy for them to provision complete, opinionated EKS clusters that meet specific
application requirements. Customers can utilize EKS Blueprints to configure and deploy purpose built
EKS clusters, and start onboarding workloads in days, rather than months.

## Consumption


1. Reference: Users can refer to the patterns and snippets provided to help guide them to their desired
solution. Users will typically view how the pattern or snippet is configured to achieve the desired
end result and then replicate that in their environment.
2. Copy & Paste: Users can copy and paste the patterns and snippets into their own environment, using
the code as the starting point for their implementation. Users can then adapt the initial pattern
to customize it to their specific needs.
3. It requires values.yaml file to be present in eks-blueprint/modules/eks_cluster.This file contains the
deployment info about ArgoCD.
you can find the template for that here - https://github.com/argoproj/argo-helm/blob/main/charts/argo-cd/values.yaml



