#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { RequestClientStack } from "../lib/request-client-stack";
import { CloudWatchStack } from "../lib/cloudwatch-stack";
import { PublicHostedZoneStack } from "../lib/public-hosted-zone-stack";
import { demoApplicationDeploy } from "../lib/utils/deploy-demo-application";

const app = new cdk.App();

const account = process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION;

console.log("account : " + account);
console.log("region : " + region);

new RequestClientStack(app, "request-client-stack", {
  env: {
	region : region
  },
  allowedCidrs: ["127.0.0.1/32"],
  webUsername: "awsuser",
  webPassword: "passw0rd",
});

new PublicHostedZoneStack(app, "public-hosted-zone-stack");
const publicHostedZoneId = cdk.Fn.importValue("publicHostedZoneId");

// create blue-cluster
const blueClusterAddOns: Array<blueprints.ClusterAddOn> = [
	new blueprints.addons.AwsLoadBalancerControllerAddOn(),
	new blueprints.addons.CalicoOperatorAddOn(),
	new blueprints.addons.SSMAgentAddOn(),
	new blueprints.addons.VpcCniAddOn({
		serviceAccountPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")]
	}),
	new blueprints.addons.ClusterAutoScalerAddOn(),
	new blueprints.addons.CoreDnsAddOn(),
	new blueprints.addons.KubeProxyAddOn("v1.23.7-eksbuild.1"),
	new blueprints.addons.ExternalDnsAddOn({
		hostedZoneResources: ["blue-cluster-hosted-zone"]
	}),
];
const blueCluster = blueprints.EksBlueprint.builder()
	.account(account)
	.region(region)
	.addOns(...blueClusterAddOns)
	.name("blue-cluster")
	.version(eks.KubernetesVersion.V1_23)
	.resourceProvider("blue-cluster-hosted-zone", new blueprints.ImportHostedZoneProvider(publicHostedZoneId))
	.resourceProvider(
		blueprints.GlobalResources.Vpc,
		new class implements blueprints.ResourceProvider<ec2.IVpc> {
			provide(context: blueprints.ResourceContext): cdk.aws_ec2.IVpc {
				return new ec2.Vpc(context.scope, "blue-cluster-vpc", {
					ipAddresses: ec2.IpAddresses.cidr("172.51.0.0/16"),
					availabilityZones: [`${region}a`, `${region}b`, `${region}c`],
					subnetConfiguration: [
						{
							cidrMask: 24,
							name: "blue-cluster-private",
							subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
						},
						{
							cidrMask: 24,
							name: "blue-cluster-public",
							subnetType: ec2.SubnetType.PUBLIC,
						},
					],
					natGatewaySubnets: {
						availabilityZones: [`${region}c`],
						subnetType: ec2.SubnetType.PUBLIC,
					},
				});
			}
		}
	)
	.useDefaultSecretEncryption(false) // set to false to turn secret encryption off (non-production/demo cases)
	.build(app, "eks-blueprint-blue-cluster");
demoApplicationDeploy(blueCluster.getClusterInfo().cluster, "demo-application-blue");

// create green-cluster
const greenClusterAddOns: Array<blueprints.ClusterAddOn> = [
	new blueprints.addons.AwsLoadBalancerControllerAddOn(),
	new blueprints.addons.CalicoOperatorAddOn(),
	new blueprints.addons.SSMAgentAddOn(),
	new blueprints.addons.VpcCniAddOn({
		serviceAccountPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")]
	}),
	new blueprints.addons.ClusterAutoScalerAddOn(),
	new blueprints.addons.CoreDnsAddOn(),
	new blueprints.addons.KubeProxyAddOn("v1.27.1-eksbuild.1"),
	new blueprints.addons.ExternalDnsAddOn({
		hostedZoneResources: ["green-cluster-hosted-zone"]
	}),
];
const greenCluster = blueprints.EksBlueprint.builder()
	.account(account)
	.region(region)
	.addOns(...greenClusterAddOns)
	.name("green-cluster")
	.version(eks.KubernetesVersion.V1_27)
	.resourceProvider("green-cluster-hosted-zone", new blueprints.ImportHostedZoneProvider(publicHostedZoneId))
	.resourceProvider(
		blueprints.GlobalResources.Vpc,
		new class implements blueprints.ResourceProvider<ec2.IVpc> {
			provide(context: blueprints.ResourceContext): cdk.aws_ec2.IVpc {
				return new ec2.Vpc(context.scope, "green-cluster-vpc", {
					ipAddresses: ec2.IpAddresses.cidr("172.61.0.0/16"),
					availabilityZones: [`${region}a`, `${region}b`, `${region}c`],
					subnetConfiguration: [
						{
							cidrMask: 24,
							name: "green-cluster-private",
							subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
						},
						{
							cidrMask: 24,
							name: "green-cluster-public",
							subnetType: ec2.SubnetType.PUBLIC,
						},
					],
					natGatewaySubnets: {
						availabilityZones: [`${region}c`],
						subnetType: ec2.SubnetType.PUBLIC,
					},
				});
			}
		}
	)
	.useDefaultSecretEncryption(false) // set to false to turn secret encryption off (non-production/demo cases)
	.build(app, "eks-blueprint-green-cluster");
demoApplicationDeploy(greenCluster.getClusterInfo().cluster, "demo-application-green");

new CloudWatchStack(app, "cloudwatch-stack");