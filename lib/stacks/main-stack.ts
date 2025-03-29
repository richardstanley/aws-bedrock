import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 buckets
    const resultsBucket = new s3.Bucket(this, 'QueryResultsBucket', {
      bucketName: `query-results-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT
          ],
          allowedOrigins: ['*'], // TODO: Restrict to specific origins
          allowedHeaders: ['*']
        }
      ],
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30)
        }
      ]
    });

    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: `csv-uploads-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT
          ],
          allowedOrigins: ['*'], // TODO: Restrict to specific origins
          allowedHeaders: ['*']
        }
      ],
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(7)
        }
      ]
    });

    // Create DynamoDB tables
    const chatHistoryTable = new dynamodb.Table(this, 'ChatHistoryTable', {
      tableName: 'chat-history',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      tableName: 'user-preferences',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    const csvMetadataTable = new dynamodb.Table(this, 'CsvMetadataTable', {
      tableName: 'csv-metadata',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'switchblade-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Create Athena Workgroup
    const workgroup = new athena.CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: 'switchblade-workgroup',
      recursiveDeleteOption: false,
      state: 'ENABLED',
      workGroupConfiguration: {
        requesterPaysEnabled: false,
        resultConfiguration: {
          outputLocation: `s3://${resultsBucket.bucketName}/athena-results/`
        }
      }
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/switchblade/application',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      retention: logs.RetentionDays.ONE_MONTH
    });

    // Create IAM roles and policies
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Grant permissions to Lambda role
    resultsBucket.grantReadWrite(lambdaRole);
    uploadBucket.grantReadWrite(lambdaRole);
    chatHistoryTable.grantReadWriteData(lambdaRole);
    userPreferencesTable.grantReadWriteData(lambdaRole);
    csvMetadataTable.grantReadWriteData(lambdaRole);
    logGroup.grantWrite(lambdaRole);

    // Output important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'ResultsBucketName', {
      value: resultsBucket.bucketName,
      description: 'S3 Bucket for Query Results'
    });

    new cdk.CfnOutput(this, 'UploadBucketName', {
      value: uploadBucket.bucketName,
      description: 'S3 Bucket for CSV Uploads'
    });
  }
} 