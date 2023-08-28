# AWS EKS Cluster Upgrade with Blue/Green Strategy with AWS CDK

[![English](https://img.shields.io/badge/lang-English-red.svg)](/README.md) [![한국어](https://img.shields.io/badge/lang-한국어-blue.svg)](/README-KR.md)

This project enables you to provision the infrastructure and demo web application required for the AWS EKS Cluster Blue/Green Upgrade lab. This demo is designed to help DevOps engineers who want to upgrade their AWS EKS cluster with a blue/green strategy.

- [What is Blue/Green Strategy?](/WHAT-IS-BLUE-GREEN.md)

This demo is based on the `ap-northeast-2`. (Seoul region)

## Demo Architecture

![demo-architecture](statics/images/demo-architecture.png)

## Quick Start

### 0. Pre-Requisites
- You'll need your own domain with **name-servers configurable**.
- [AWS Account](https://aws.amazon.com/resources/create-account/) : Create an AWS account and set the [AdministratorAccess](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/getting-set-up.html#create-an-admin) permission to a user in that account. The user's permissions are required to provision AWS resources such as VPCs, EKS, and ALBs required for the demo.
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) : Install the AWS CLI, and [set up the aws credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html#cli-configure-files-format) on the PC where you want to perform the demo.
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [docker](https://docs.docker.com/engine/install/)
- [npm](https://nodejs.org/ko/download)
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

### 1. Clone this project and modify some code for the demo.
*1-1.* Clone that project to your local PC with the `git clone` command.
```bash
git clone git@github.com:aws-samples/eks-cluster-upgrade-with-a-blue-green-strategy.git
```

*1-2.* To utilize **your own domain** in the demo, change the domain value in the code below.
- [public-hosted-zone-stack.ts](/aws-cdks/my-eks-blueprints/lib/public-hosted-zone-stack.ts#L9) : Modify the value of the `HostedZoneName` variable.
- [demo-application-blue.yaml](/aws-cdks/my-eks-blueprints/lib/utils/manifests/demo-application-blue.yaml#L46) & [demo-application-green.yaml](/aws-cdks/my-eks-blueprints/lib/utils/manifests/demo-application-green.yaml#L46) : Modify the value of the `external-dns.alpha.kubernetes.io/hostname` annotation.

*1-3.* Update the dashboard access information for the network load generation tool. ([Locust](https://locust.io/))
- [my-eks-blueprints](/aws-cdks/my-eks-blueprints/bin/my-eks-blueprints.ts#L19-L21)
  - `allowedCidrs` : Set the range of CIDR addresses to allow access when accessing the Locust dashboard.
  - `webUsername` & `webPassword` : Set the account information to use when logging in to the Locust dashboard.

### 2. Setup CDK and Deploy CDK Stack
```bash
cd aws-cdks/my-eks-blueprints/
npm install
cdk bootstrap
cdk synth
cdk deploy --all
```
Please check for each stack provisioned through the terminal and type `y` to the question.
Through this task, provision [the architecture shown in the figure above](#demo-architecture). It takes approximately **15-30 minutes**.

### 3. Set up nameservers for your domain
Once the entire CDK Stack is provisioned, refer to the Public hosted zone created on Route53 to change the domain nameserver settings.

### 4. Continuous HTTP request load for EKS clusters
Access the dashboard of the Network Load Balancer (Locust) through a browser. The endpoint you need to connect to is the endpoint of the Application Load Balancer, which is created when provisioning the `request-client` Stack. Access the dashboard with the account information you set up in [step 1](#1-clone-this-project-and-modify-some-code-for-the-demo). Next, enter the domain you specified in `Host` and click the `Start swarming` button to start generating traffic.

![locust-login](statics/images/locust-dashboard-insert-userinfo.png)

![locust-dashboard](statics/images/locust-dashboard-init-page.png)

### 5. Modify weighted traffic values for EKS cluster switching
The Route53 weighted routing feature adjusts the weight value of traffic flowing to the blue and green clusters.
As shown in the example below, you can adjust the weight values to gradually shift traffic from the blue cluster to the green cluster.
- 1st : `BLUE(80%):GREEN(20%)`
- 2nd : `BLUE(50%):GREEN(50%)`
- 3rd : `BLUE(20%):GREEN(80%)`
- finally : `BLUE(0%):GREEN(100%)`

Note that the initial weighting values are set to `BLUE(100%):GREEN(0%)`.

The weight value can be adjusted by modifying the value of the `external-dns.alpha.kubernetes.io/aws-weight` annotation within [demo-aplication-blue.yaml](/aws-cdks/my-eks-blueprints/lib/utils/manifests/demo-application-blue.yaml#L47) and [demo-application-green.yaml](/aws-cdks/my-eks-blueprints/lib/utils/manifests/demo-application-green.yaml#L47). The value is entered as a percentage.

After modifying the weight values in the code, redeploy the CDK Stack to update the weighted routing settings for the Route53 record.

```bash
cd aws-cdks/my-eks-blueprints/
cdk deploy --all
```

For rollbacks, you can do the opposite and update the weight values to `BLUE(100%):GREEN(0%)`.

### 6. Monitoring network traffic with CloudWatch Dashboard

Go to the CloudWatch console and refer to the CloudWatch dashboard named `EKS_Monitoring_Dashboard` to monitor the process of changing the weight value to make sure it works properly.

![cloudwatch-monitoring](statics/images/cloudwatch-monitoring.png)

## Clean-up
```bash
cd aws-cdks/my-eks-blueprints/
cdk destroy --all
```

## Security
See [CONTRIBUTING](/CONTRIBUTING.md#security-issue-notifications) for more information.

## License
This library is licensed under the MIT-0 License. See the [LICENSE](/LICENSE) file.