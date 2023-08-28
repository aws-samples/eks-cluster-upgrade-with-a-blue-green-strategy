import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { AssetImage } from 'aws-cdk-lib/aws-ecs';
import { LocustService } from './constructs/locust-service';

interface LoadTestStackProps extends StackProps {
  readonly allowedCidrs: string[];
  readonly certificateArn?: string;
  readonly webUsername?: string;
  readonly webPassword?: string;
}

export class RequestClientStack extends Stack {
  constructor(scope: Construct, id: string, props: LoadTestStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'RequestClientVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.100.0.0/24'),
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, 'LocustCluster', {
      vpc: vpc,
      containerInsights: true,
    });

    const locustImage = new AssetImage('app');

    const locust = new LocustService(this, 'Locust', {
      image: locustImage,
      cluster: cluster,
      certificationArn: props.certificateArn,
      allowedCidrs: props.allowedCidrs,
      webUsername: props.webUsername,
      webPassword: props.webPassword,
    });
  }
}
