# Introduction

New versions of Kubernetes are released approximately every four months, and the Amazon EKS service also reaches released approximately every four months. Because Kubernetes and Amazon EKS do not yet support Long Term Support (LTS), it is recommended that you upgrade your cluster version periodically. Customers using Amazon EKS are encouraged to upgrade their Amazon EKS clusters periodically for better functionality and security improvements. There are many ways to upgrade your cluster version, and you can take different strategies depending on the type of workload you have or how much you care about cost and availability. Among them, the blue/green method of upgrading your AWS EKS cluster version has the following advantages and disadvantages.

*Advantages*
- When upgrading cluster versions, you can skip multiple versions at once.
- Upgrade operations can be performed with non-disruptive or minimal downtime.
- If something goes wrong during the upgrade operation, you can quickly and easily roll back.
- You can isolate the upgrade cluster from your existing cluster.
- You can experiment with the upgrade environment in advance.

*Disadvantages*
- You have to maintain two clusters during the upgrade process, which doubles your infrastructure costs.

Because of these tradeoffs, the blue/green approach is a good strategy to use when you need stability or a rollbackable environment.

*References*
- [Amazon EKS platform versions](https://docs.aws.amazon.com/eks/latest/userguide/platform-versions.html)
- [Amazon EKS Kubernetes versions](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html)

# What is Blue/Green Strategy?

A blue/green deployment strategy is an approach to deploying systems that alternates between production and staging environments. The production environment is called "blue" and the staging environment is called "green". During peacetime, you only serve requests to the blue environment. If you need to do something like deploy a patch or update, you do it in green, which is a non-live environment. Once the work is complete, we test and validate the green environment over a private network to ensure that the changes work as expected. Once verified, we swap the green environment with the blue environment, effectively making the changes live.

*References*
- [Wikipedia : Blue-green deployment](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment)

So how can you effectively upgrade your AWS EKS cluster version using a blue/green deployment strategy? The illustration below will help you understand how to perform the upgrade operation.

![blue-green-architecture-gif](statics/images/eks-blue-green-animation.gif)

The sequence of the blue/green deployment strategy for upgrading an AWS EKS cluster is as follows :

1. Provision a new EKS cluster (green) with the version to be updated.
2. Deploy the same applications and add-ons that are deployed on the existing cluster (blue) to the new cluster (green). During this process, perform validation tasks, such as using deprecated APIs or the correct add-on version.
3. Set up weight-based routing on Route53 utilizing the external-dns add-on. Use the weight-based routing feature to route both existing and new clusters. When you set the weights, configure them to gradually increase traffic to the new cluster.
   - ex) 
      - `BLUE(90):GREEN(10)` -> `BLUE(70):GREEN(30)` -> `BLUE(50):GREEN(50)` -> `BLUE(30):GREEN(70)` -> `BLUE(10):GREEN(90)` -> `BLUE(0):GREEN(100)`
      - In this way, you can safely switch traffic to the new cluster without disruption and with minimal impact to your production environment. This method of splitting traffic between the old and new versions and gradually moving to the new version is sometimes referred to as a canary deployment.
      - If something goes wrong on the new cluster during this process, you can perform a rollback by switching 100% of your traffic to the old cluster.
      - In conclusion, the upgrade is complete when 100% of the traffic is switched to the new cluster.

In the blue/green method, the rollback is performed as follows : 

![blue-green-architecture-rollback-gif](statics/images/eks-blue-green-rollback-animation.gif)

# References
- [AWS Blog : Kubernetes cluster upgrade: the blue-green deployment strategy](https://aws.amazon.com/ko/blogs/containers/kubernetes-cluster-upgrade-the-blue-green-deployment-strategy/)
- [AWS Blog : Blue/Green or Canary Amazon EKS cluster migration for stateless ArgoCD workloads](https://aws.amazon.com/ko/blogs/containers/blue-green-or-canary-amazon-eks-clusters-migration-for-stateless-argocd-workloads/)
- [AWS Blog : Blue/Green, Canary 방법을 활용한 stateless 워크로드의 Amazon EKS 클러스터 마이그레이션 전략](https://aws.amazon.com/ko/blogs/tech/blue-green-or-canary-amazon-eks-clusters-migration-for-stateless-argocd-workloads/)
- [AWS Blog : LG U+의 GitOps를 이용한 Amazon EKS 클러스터 무중단 버전 업데이트 사례](https://aws.amazon.com/ko/blogs/tech/lg-uplus-eks-cluster-version-upgrade-with-zero-downtime/?utm_source=dlvr.it&utm_medium=facebook)