import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AthenaConstructProps {
  resultsBucket: s3.IBucket;
  logGroup: logs.ILogGroup;
}

export class AthenaConstruct extends Construct {
  public readonly workgroup: athena.CfnWorkGroup;
  public readonly athenaRole: iam.Role;
  public readonly athenaPolicy: iam.Policy;

  constructor(scope: Construct, id: string, props: AthenaConstructProps) {
    super(scope, id);

    // Create IAM role for Athena
    this.athenaRole = new iam.Role(this, 'AthenaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('athena.amazonaws.com'),
      description: 'Role for Athena query execution'
    });

    // Create IAM policy for Athena
    this.athenaPolicy = new iam.Policy(this, 'AthenaPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'athena:StartQueryExecution',
            'athena:GetQueryExecution',
            'athena:GetQueryResults',
            'athena:StopQueryExecution',
            'athena:ListQueryExecutions',
            'glue:GetTable',
            'glue:GetDatabase',
            'glue:GetDatabases',
            'glue:GetTableVersions',
            'glue:GetPartitions',
            'glue:BatchGetPartition',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetBucketLocation',
            's3:GetObject',
            's3:ListBucket',
            's3:PutObject'
          ],
          resources: [
            props.resultsBucket.bucketArn,
            `${props.resultsBucket.bucketArn}/*`
          ]
        })
      ]
    });

    // Attach policy to role
    this.athenaPolicy.attachToRole(this.athenaRole);

    // Create Athena Workgroup with cost optimization settings
    this.workgroup = new athena.CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: `switchblade-workgroup-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      recursiveDeleteOption: false,
      state: 'ENABLED',
      workGroupConfiguration: {
        requesterPaysEnabled: false,
        resultConfiguration: {
          outputLocation: `s3://${props.resultsBucket.bucketName}/athena-results/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_S3'
          }
        },
        engineVersion: {
          selectedEngineVersion: 'AUTO',
          effectiveEngineVersion: 'AUTO'
        },
        publishCloudWatchMetricsEnabled: true,
        bytesScannedCutoffPerQuery: 100000000, // 100MB
        enforceWorkGroupConfiguration: true
      }
    });

    // Create CloudWatch metrics for Athena
    const queryExecutionTime = new cloudwatch.Metric({
      namespace: 'Athena',
      metricName: 'QueryExecutionTime',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      dimensionsMap: {
        WorkGroup: this.workgroup.name
      }
    });

    const queryQueueTime = new cloudwatch.Metric({
      namespace: 'Athena',
      metricName: 'QueryQueueTime',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      dimensionsMap: {
        WorkGroup: this.workgroup.name
      }
    });

    const queryPlanningTime = new cloudwatch.Metric({
      namespace: 'Athena',
      metricName: 'QueryPlanningTime',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      dimensionsMap: {
        WorkGroup: this.workgroup.name
      }
    });

    const queryExecutionErrorCount = new cloudwatch.Metric({
      namespace: 'Athena',
      metricName: 'QueryExecutionErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      dimensionsMap: {
        WorkGroup: this.workgroup.name
      }
    });

    // Create CloudWatch alarms
    new cloudwatch.Alarm(this, 'AthenaHighExecutionTimeAlarm', {
      metric: queryExecutionTime,
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Athena query execution time is too high'
    });

    new cloudwatch.Alarm(this, 'AthenaHighQueueTimeAlarm', {
      metric: queryQueueTime,
      threshold: 10000, // 10 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Athena query queue time is too high'
    });

    new cloudwatch.Alarm(this, 'AthenaHighPlanningTimeAlarm', {
      metric: queryPlanningTime,
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Athena query planning time is too high'
    });

    new cloudwatch.Alarm(this, 'AthenaHighErrorRateAlarm', {
      metric: queryExecutionErrorCount,
      threshold: 5,
      evaluationPeriods: 5,
      datapointsToAlarm: 3,
      alarmDescription: 'Athena query error rate is too high'
    });

    // Grant CloudWatch Logs permissions
    props.logGroup.grantWrite(this.athenaRole);
  }
} 