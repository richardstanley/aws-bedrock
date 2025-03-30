import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';
import { BedrockConstruct } from './bedrock-construct';
import { AthenaConstruct } from './athena-construct';

export interface IamConstructProps {
  resultsBucket: s3.Bucket;
  uploadBucket: s3.Bucket;
  chatHistoryTable: dynamodb.Table;
  csvMetadataTable: dynamodb.Table;
  savedResultsTable: dynamodb.Table;
  queryStatusTable: dynamodb.Table;
  logGroup: logs.LogGroup;
  bedrock: BedrockConstruct;
  athena: AthenaConstruct;
  api: appsync.GraphqlApi;
}

export class IamConstruct extends Construct {
  public readonly lambdaRole: iam.Role;
  public readonly appSyncServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // Create Lambda execution role
    this.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Grant permissions to Lambda role
    props.resultsBucket.grantReadWrite(this.lambdaRole);
    props.uploadBucket.grantReadWrite(this.lambdaRole);
    props.chatHistoryTable.grantReadWriteData(this.lambdaRole);
    props.csvMetadataTable.grantReadWriteData(this.lambdaRole);
    props.savedResultsTable.grantReadWriteData(this.lambdaRole);
    props.logGroup.grantWrite(this.lambdaRole);
    props.bedrock.bedrockPolicy.attachToRole(this.lambdaRole);

    // Create AppSync service role
    this.appSyncServiceRole = new iam.Role(this, 'AppSyncServiceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    // Grant permissions to AppSync service role
    props.resultsBucket.grantReadWrite(this.appSyncServiceRole);
    props.uploadBucket.grantReadWrite(this.appSyncServiceRole);
    props.uploadBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:GetObject'],
      resources: [props.uploadBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('appsync.amazonaws.com')]
    }));

    // Grant DynamoDB permissions to AppSync service role
    const dynamoDbPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [
        props.chatHistoryTable.tableArn,
        props.chatHistoryTable.tableArn + '/index/userId-timestamp-index',
        props.csvMetadataTable.tableArn,
        props.savedResultsTable.tableArn,
        props.queryStatusTable.tableArn
      ]
    });

    this.appSyncServiceRole.addToPrincipalPolicy(dynamoDbPolicy);
    props.logGroup.grantWrite(this.appSyncServiceRole);
    props.bedrock.bedrockPolicy.attachToRole(this.appSyncServiceRole);
    props.athena.athenaPolicy.attachToRole(this.appSyncServiceRole);

    // Grant permissions to AppSync data source roles
    const dataSourceRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [
        props.chatHistoryTable.tableArn,
        props.chatHistoryTable.tableArn + '/index/userId-timestamp-index',
        props.csvMetadataTable.tableArn,
        props.savedResultsTable.tableArn,
        props.queryStatusTable.tableArn
      ]
    });

    // Add the policy to the AppSync service role
    this.appSyncServiceRole.addToPrincipalPolicy(dataSourceRolePolicy);
  }
} 