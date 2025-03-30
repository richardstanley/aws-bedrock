import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create test user role
    const testUserRole = new iam.Role(this, 'TestUserRole', {
      assumedBy: new iam.AccountPrincipal(this.account),
      roleName: 'switchblade-test-role'
    });

    // Create test user policy
    const testUserPolicy = new iam.Policy(this, 'TestUserPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket'
          ],
          resources: [
            `arn:aws:s3:::query-results-${this.account}-${this.region}`,
            `arn:aws:s3:::query-results-${this.account}-${this.region}/*`,
            `arn:aws:s3:::csv-uploads-${this.account}-${this.region}`,
            `arn:aws:s3:::csv-uploads-${this.account}-${this.region}/*`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:Query',
            'dynamodb:Scan'
          ],
          resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/chat-history`]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'athena:StartQueryExecution',
            'athena:GetQueryExecution',
            'athena:GetQueryResults'
          ],
          resources: [`arn:aws:athena:${this.region}:${this.account}:workgroup/switchblade-workgroup`]
        })
      ]
    });

    // Attach policy to role
    testUserPolicy.attachToRole(testUserRole);

    // Grant permissions to test role
    const resultsBucket = s3.Bucket.fromBucketName(this, 'ResultsBucket', `query-results-${this.account}-${this.region}`);
    const uploadBucket = s3.Bucket.fromBucketName(this, 'UploadBucket', `csv-uploads-${this.account}-${this.region}`);
    const chatHistoryTable = dynamodb.Table.fromTableName(this, 'ChatHistoryTable', 'chat-history');
    const logGroup = logs.LogGroup.fromLogGroupName(this, 'ApplicationLogs', '/switchblade/application');

    resultsBucket.grantReadWrite(testUserRole);
    uploadBucket.grantReadWrite(testUserRole);
    chatHistoryTable.grantReadWriteData(testUserRole);
    logGroup.grantWrite(testUserRole);
  }
} 