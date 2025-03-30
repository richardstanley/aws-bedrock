import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface BedrockConstructProps {
  logGroup: logs.ILogGroup;
}

export class BedrockConstruct extends Construct {
  public readonly bedrockRole: iam.Role;
  public readonly bedrockPolicy: iam.Policy;

  constructor(scope: Construct, id: string, props: BedrockConstructProps) {
    super(scope, id);

    // Create IAM role for Bedrock
    this.bedrockRole = new iam.Role(this, 'BedrockRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Create IAM policy for Bedrock
    this.bedrockPolicy = new iam.Policy(this, 'BedrockPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'bedrock:InvokeModel',
            'bedrock-nova-micro:InvokeModel'
          ],
          resources: ['*'] // TODO: Restrict to specific model ARNs
        })
      ]
    });

    // Attach policy to role
    this.bedrockPolicy.attachToRole(this.bedrockRole);

    // Grant CloudWatch Logs permissions
    props.logGroup.grantWrite(this.bedrockRole);

    // Create CloudWatch metric for Bedrock latency
    const bedrockLatency = new cloudwatch.Metric({
      namespace: 'Switchblade',
      metricName: 'BedrockLatency',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      dimensionsMap: {
        Service: 'BedrockNovaMicro'
      }
    });

    // Create CloudWatch alarm for high latency
    new cloudwatch.Alarm(this, 'BedrockHighLatencyAlarm', {
      metric: bedrockLatency,
      threshold: 1000, // 1 second
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Bedrock Nova Micro response time is too high'
    });
  }
} 