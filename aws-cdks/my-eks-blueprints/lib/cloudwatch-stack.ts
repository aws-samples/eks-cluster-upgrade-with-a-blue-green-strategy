import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cw from "aws-cdk-lib/aws-cloudwatch";

export class CloudWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

		// Create CloudWatch Dashboard
    const dashboard = new cw.Dashboard(this, "Dashboard", {
      dashboardName: "EKS_Monitoring_Dashboard",
    });

		// Create EKS Metrics Widget
		const eksTitleWidget = new cw.TextWidget({
			markdown: "# EKS Ingress ALB Metrics",
			width: 12,
			height: 1,
		});
		
		let eksAlbMetrics = new cw.MathExpression({
			expression: "SELECT SUM(RequestCount) FROM SCHEMA(\"AWS/ApplicationELB\", LoadBalancer) GROUP BY LoadBalancer",
			period: cdk.Duration.minutes(1),
			label: "Query1",
		});
		const EKSAlbRequestWidget = new cw.GraphWidget({
			title: "EKS Ingress ALB Requests (sum)",
			left: [eksAlbMetrics],
			statistic: "Sum",
			width: 12,
		});
		
		let eksAlb2xxCountMetrics = new cw.MathExpression({
			expression: "SELECT COUNT(HTTPCode_Target_2XX_Count) FROM SCHEMA(\"AWS/ApplicationELB\", LoadBalancer) GROUP BY LoadBalancer",
			period: cdk.Duration.minutes(1),
			label: "Query1"
		});
		const EKSAlb2xxCountWidget = new cw.GraphWidget({
			title: "EKS Ingress ALB HTTPCode_Target_2XX_Count (sum)",
			left: [eksAlb2xxCountMetrics],
			statistic: "Sum",
			width: 12,
		});

		let eksAlb5xxCountMetrics = new cw.MathExpression({
			expression: "SELECT COUNT(HTTPCode_ELB_5XX_Count) FROM SCHEMA(\"AWS/ApplicationELB\", LoadBalancer) GROUP BY LoadBalancer",
			period: cdk.Duration.minutes(1),
			label: "Query1"
		})
		const EKSAlb5xxCountWidget = new cw.GraphWidget({
			title: "EKS Ingress ALB HTTPCode_ELB_5XX_Count (sum)",
			left: [eksAlb5xxCountMetrics],
			statistic: "Sum",
			width: 12,
		});

		dashboard.addWidgets(eksTitleWidget);
		dashboard.addWidgets(EKSAlbRequestWidget);
		dashboard.addWidgets(EKSAlb2xxCountWidget)
		dashboard.addWidgets(EKSAlb5xxCountWidget);

		// Create EC2 Metrics Widget
		const ec2TitleWidget = new cw.TextWidget({
			markdown: "# EC2 Worker Node Metrics",
			width: 12,
			height: 1,
		});
		let ec2CpuUtilizationMetric = new cw.MathExpression({
			expression: "SELECT AVG(\"CPUUtilization\") FROM \"AWS/EC2\" GROUP BY AutoScalingGroupName",
			period: cdk.Duration.minutes(1),
			label: "Query1",
		});
		const extractEC2Widget = new cw.GraphWidget({
			title: "EC2 Worker Node CPUUtilizations (avg)",
			left: [ec2CpuUtilizationMetric],
			statistic: "Average",
			width: 12,
		});
		ec2TitleWidget.position(13,0);
		extractEC2Widget.position(13,1)
		dashboard.addWidgets(ec2TitleWidget);
		dashboard.addWidgets(extractEC2Widget);

  }
}
