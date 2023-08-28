import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";

export class PublicHostedZoneStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const hostedZoneName = "example.com";
    const hostedZone = new PublicHostedZone(this, "my-hosted-zone", {
      zoneName: hostedZoneName,
    });

    new cdk.CfnOutput(this, "publicHostedZoneId", {
      value: hostedZone.hostedZoneId,
      description: "public hosted zone id",
      exportName: "publicHostedZoneId",
    });
  }
}
