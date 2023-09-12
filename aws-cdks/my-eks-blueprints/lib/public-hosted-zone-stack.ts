import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";

interface PublicHostedZoneStackProps extends cdk.StackProps {
  readonly hostedZoneName: string;
  readonly isHostedZoneAlreadyExists: string;
}

export class PublicHostedZoneStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PublicHostedZoneStackProps) {
    super(scope, id, props);

    if (props.isHostedZoneAlreadyExists == "true") {
      const isAlreadyExistHostedZone = route53.PublicHostedZone.fromLookup(
        this,
        "get-existing-hosted-zone",
        { domainName: props.hostedZoneName }
      );
      console.log(
        "isAlreadyExistHostedZone : " + isAlreadyExistHostedZone.hostedZoneArn
      );

      new cdk.CfnOutput(this, "publicHostedZoneId", {
        value: isAlreadyExistHostedZone.hostedZoneId,
        description: "public hosted zone id",
        exportName: "publicHostedZoneId",
      });
    } else { 
      let hostedZone = new PublicHostedZone(this, "my-hosted-zone", {
        zoneName: props.hostedZoneName,
      });
  
      new cdk.CfnOutput(this, "publicHostedZoneId", {
        value: hostedZone.hostedZoneId,
        description: "public hosted zone id",
        exportName: "publicHostedZoneId",
      });
    }
  }
}
