import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  ApplicationProtocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export interface LocustServiceProps {
  readonly image: ecs.ContainerImage;
  readonly cluster: ecs.ICluster;
  readonly certificationArn?: string;
  readonly allowedCidrs: string[];
  readonly webUsername?: string;
  readonly webPassword?: string;
}

export class LocustService extends Construct {
  public readonly configMapHostName: string;
  private readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: LocustServiceProps) {
    super(scope, id);

    const { cluster, image, webUsername, webPassword } = props;

    const protocol =
      props.certificationArn != null
        ? ApplicationProtocol.HTTPS
        : ApplicationProtocol.HTTP;

    let certificate = undefined;
    if (props.certificationArn != null) {
      certificate = Certificate.fromCertificateArn(
        this,
        "Cert",
        props.certificationArn
      );
    }

    const masterTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        cpu: 1024,
        memoryLimitMiB: 2048,
      }
    );

    const command = [];
    if (webUsername != null && webPassword != null) {
      command.push("--web-auth");
      command.push(`${webUsername}:${webPassword}`);
    }

    masterTaskDefinition.addContainer("locust", {
      image,
      command,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "locust",
        logRetention: RetentionDays.ONE_WEEK,
      }),
      portMappings: [
        {
          containerPort: 8089,
        },
      ],
    });

    const locustService = new ApplicationLoadBalancedFargateService(
      this,
      "Service",
      {
        cluster,
        desiredCount: 1,
        targetProtocol: ApplicationProtocol.HTTP,
        protocol: protocol,
        openListener: false,
        cpu: 1024,
        memoryLimitMiB: 2048,
        taskDefinition: masterTaskDefinition,
        healthCheckGracePeriod: Duration.seconds(20),
        certificate: certificate,
        sslPolicy:
          protocol == ApplicationProtocol.HTTPS
            ? SslPolicy.RECOMMENDED
            : undefined,
        circuitBreaker: { rollback: true },
      }
    );

    locustService.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "10"
    );

    locustService.targetGroup.configureHealthCheck({
      interval: Duration.seconds(15),
      healthyThresholdCount: 2,
      healthyHttpCodes: "200,401",
    });

    const port = protocol == ApplicationProtocol.HTTPS ? 443 : 80;
    props.allowedCidrs.forEach((cidr) =>
      locustService.loadBalancer.connections.allowFrom(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(port)
      )
    );

    this.service = locustService.service;
  }
}
