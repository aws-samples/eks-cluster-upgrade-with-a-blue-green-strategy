# Introduction

쿠버네티스의 새로운 버전은 약 4개월 간격으로 릴리즈 되며, Amazon EKS 서비스 또한 이에 맞춰 약 4개월 간격으로 릴리즈 일정이 계획됩니다. 쿠버네티스 및 Amazon EKS는 LTS(Long Term Support)를 지원하고 있지 않기 때문에 주기적으로 클러스터 버전을 업그레이드 해야합니다. Amazon EKS를 사용하는 고객은 더 나은 기능과 보안 향상을 위해 주기적으로 Amazon EKS 클러스터를 업그레이드 하는 것이 권장됩니다. 클러스터 버전을 업그레이드 하는 방법은 다양하며, 워크로드 형태 또는 비용 및 가용성 측면에서 고려하는 정도에 따라 여러가지 전략을 취할 수 있습니다. 그 중, 블루/그린 방법의 AWS EKS 클러스터 버전 업그레이드 작업은 아래와 같은 장단점을 갖고 있습니다.

*장점*
- 한번에 여러 버전을 건너뛸 수 있습니다.
- 무중단으로 업그레이드 작업을 수행할 수 있습니다.
- 업그레이드 작업 과정에서 문제 발생 시 쉽고 빠르게 롤백할 수 있습니다.
- 기존 클러스터와 업그레이드 클러스터를 격리할 수 있습니다.
- 업그레이드 환경을 미리 실험 해볼 수 있습니다.

*단점*
- 업그레이드 작업 과정 동안 두 개의 클러스터를 유지 해야하므로, 인프라 비용이 두 배가 됩니다.

이러한 장단점으로 인해 블루/그린 방식은 안정성 또는 롤백 가능한 환경이 필요할 때 사용하기 적합한 전략입니다.

*참고*
- [Amazon EKS 플랫폼 버전](https://docs.aws.amazon.com/ko_kr/eks/latest/userguide/platform-versions.html)
- [사용 가능한 Amazon EKS 쿠버네티스 버전](https://docs.aws.amazon.com/ko_kr/eks/latest/userguide/kubernetes-versions.html)

# What is Blue/Green Strategy?

블루/그린 배포 전략이란, 운영 환경과 스테이징 환경을 번갈아 가며 시스템을 배포하는 방식을 말합니다.
운영 환경을 "블루"라고 부르고, 스테이징 환경을 "그린"이라고 부릅니다. 
평시에는 블루 환경으로만 요청을 처리합니다. 만약 패치 배포나 업데이트와 같은 작업을 해야할 경우 비라이브 환경인 그린에서 수행합니다.
작업이 완료되면 프라이빗 네트워크를 통해 그린 환경을 테스트 및 유효성 검증을 통해 변경 사항이 예상대로 작동하는지 확인합니다.
확인이 완료되면 그린 환경을 블루 환경과 교체하여 변경 사항을 효과적으로 라이브 상태로 만듭니다.

*참고*
- [Wikipedia : Blue-green deployment](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment)

그렇다면 블루/그린 배포 전략을 사용해서 어떻게 효과적으로 AWS EKS 클러스터 버전을 업그레이드 할 수 있을까요?
아래 그림을 통해 어떻게 업그레이드 작업을 수행하는지 이해할 수 있습니다.

![blue-green-architecture-gif](statics/images/eks-blue-green-animation.gif)

AWS EKS 클러스터 업그레이드를 위한 블루/그린 배포 전략의 순서는 아래와 같습니다.
1. 업데이트 할 버전으로 새로운 EKS 클러스터(그린)를 프로비저닝 합니다.
2. 기존 클러스터(블루)에 배포되어있는 애플리케이션 및 에드온을 새로운 클러스터(그린)에 동일하게 배포합니다. 이 과정에서 Deprecated된 API 또는 알맞은 에드온 버전 사용 등 유효성 검증 작업을 수행합니다.
3. external-dns 에드온을 활용하여 Route53에서 가중치 기반 라우팅 설정을 합니다. 가중치 기반 라우팅 기능을 통해 기존 클러스터와 새로운 클러스터 모두 라우팅 합니다.
   가중치를 설정할 때, 새로운 클러스터로 트래픽이 점진적으로 늘어나도록 구성합니다. 
   예 : 
      - `블루(90):그린(10)` -> `블루(70):그린(30)` -> `블루(50):그린(50)` -> `블루(30):그린(70)` -> `블루(10):그린(90)` -> `블루(0):그린(100)`
      - 이러한 방법을 통해 중단 없이 운영 환경에 영향을 최소화 하면서 안전하게 새로운 클러스터로 트래픽을 전환할 수 있습니다. 이처럼 기존 버전과 새 버전간에 트래픽을 분할하여 점진적으로 새 버전으로 옮겨가는 방식을 카나리아 배포라고도 부릅니다.
      - 만약 이 과정에서 새로운 클러스터에서 문제가 발생했을 경우, 기존 클러스터로 트래픽을 100% 전환하여 롤백을 수행할 수 있습니다.
      - 결론적으로 새로운 클러스터로 트래픽이 100% 전환되면 업그레이드 작업이 완료됩니다.

블루/그린 방식에서 롤백은 아래와 같이 수행됩니다.

![blue-green-architecture-rollback-gif](statics/images/eks-blue-green-rollback-animation.gif)

# References
- [AWS Blog : Kubernetes cluster upgrade: the blue-green deployment strategy](https://aws.amazon.com/ko/blogs/containers/kubernetes-cluster-upgrade-the-blue-green-deployment-strategy/)
- [AWS Blog : Blue/Green or Canary Amazon EKS cluster migration for stateless ArgoCD workloads](https://aws.amazon.com/ko/blogs/containers/blue-green-or-canary-amazon-eks-clusters-migration-for-stateless-argocd-workloads/)
- [AWS Blog : Blue/Green, Canary 방법을 활용한 stateless 워크로드의 Amazon EKS 클러스터 마이그레이션 전략](https://aws.amazon.com/ko/blogs/tech/blue-green-or-canary-amazon-eks-clusters-migration-for-stateless-argocd-workloads/)
- [AWS Blog : LG U+의 GitOps를 이용한 Amazon EKS 클러스터 무중단 버전 업데이트 사례](https://aws.amazon.com/ko/blogs/tech/lg-uplus-eks-cluster-version-upgrade-with-zero-downtime/?utm_source=dlvr.it&utm_medium=facebook)