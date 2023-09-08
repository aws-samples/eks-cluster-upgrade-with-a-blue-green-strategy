import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";

interface PublicHostedZoneStackProps extends cdk.StackProps {
  readonly hostedZoneName: string;
}

export class PublicHostedZoneStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PublicHostedZoneStackProps) {
    super(scope, id, props);

    const hostedZone = new PublicHostedZone(this, "my-hosted-zone", {
      zoneName: props.hostedZoneName,
    });

    new cdk.CfnOutput(this, "publicHostedZoneId", {
      value: hostedZone.hostedZoneId,
      description: "public hosted zone id",
      exportName: "publicHostedZoneId",
    });
  }
}
