import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import { BedrockConstruct } from '../constructs/bedrock-construct';
import { AthenaConstruct } from '../constructs/athena-construct';
import { IamConstruct } from '../constructs/iam-construct';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create CloudWatch metrics and alarms
    const queryLatency = new cloudwatch.Metric({
      namespace: 'Switchblade',
      metricName: 'QueryLatency',
      statistic: 'Average',
      period: cdk.Duration.minutes(1)
    });

    // Create CloudWatch alarm for high latency
    new cloudwatch.Alarm(this, 'QueryHighLatencyAlarm', {
      metric: queryLatency,
      threshold: 3000, // 3 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Query execution time is too high'
    });

    // Create CloudWatch metrics for errors
    const errorRate = new cloudwatch.Metric({
      namespace: 'Switchblade',
      metricName: 'ErrorRate',
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Create CloudWatch alarm for high error rate
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRate,
      threshold: 10,
      evaluationPeriods: 5,
      datapointsToAlarm: 3,
      alarmDescription: 'Error rate is too high'
    });

    // Create CloudWatch alarm for Bedrock errors
    new cloudwatch.Alarm(this, 'BedrockErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Bedrock',
        metricName: 'InvokeModelError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(1)
      }),
      threshold: 5,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Bedrock model invocation errors are too high'
    });

    // Create CloudWatch alarm for Athena errors
    new cloudwatch.Alarm(this, 'AthenaErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Athena',
        metricName: 'QueryExecutionError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(1)
      }),
      threshold: 5,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Athena query execution errors are too high'
    });

    // Create CloudWatch Log Group for application logs
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/lambda/switchblade',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create Bedrock construct
    const bedrock = new BedrockConstruct(this, 'Bedrock', {
      logGroup
    });

    // Create S3 buckets
    const resultsBucket = new s3.Bucket(this, 'QueryResultsBucket', {
      bucketName: `query-results-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
      ],
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      })
    });

    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: `csv-uploads-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
      ],
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      })
    });

    // Create Athena construct
    const athena = new AthenaConstruct(this, 'Athena', {
      resultsBucket,
      logGroup
    });

    // Create DynamoDB table with GSI
    const chatHistoryTable = new dynamodb.Table(this, 'ChatHistoryTable', {
      tableName: `chat-history-${this.account}-${this.region}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // @ts-ignore - CDK type definitions are outdated
      globalSecondaryIndexes: {
        'userId-timestamp-index': {
          partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
          projectionType: dynamodb.ProjectionType.ALL
        }
      }
    });

    const csvMetadataTable = new dynamodb.Table(this, 'CsvMetadataTable', {
      tableName: `csv-metadata-${this.account}-${this.region}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    const savedResultsTable = new dynamodb.Table(this, 'SavedResultsTable', {
      tableName: `saved-results-${this.account}-${this.region}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'resultId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl'
    });

    const queryStatusTable = new dynamodb.Table(this, 'QueryStatusTable', {
      tableName: `query-status-${this.account}-${this.region}`,
      partitionKey: { name: 'queryId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl'
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
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
        custom: true,
        userSrp: true
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:3000/auth/callback'],
        logoutUrls: ['http://localhost:3000/auth/logout']
      }
    });

    // Create AppSync API
    // @ts-ignore - CDK type definitions are outdated
    const api = new appsync.GraphqlApi(this, 'SwitchbladeApi', {
      name: 'switchblade-api',
      definition: appsync.Definition.fromFile('schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      xrayEnabled: true,
      // @ts-ignore - CDK type definitions are outdated
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['*'],
        maxAge: cdk.Duration.days(1)
      }
    });

    // Create IAM construct
    const iamConstruct = new IamConstruct(this, 'IamConstruct', {
      resultsBucket,
      uploadBucket,
      chatHistoryTable,
      csvMetadataTable,
      savedResultsTable,
      queryStatusTable,
      logGroup,
      bedrock,
      athena,
      api
    });

    // Create AppSync data sources
    const s3DataSource = api.addHttpDataSource('S3DataSource', 'https://s3.amazonaws.com', {
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 's3'
      }
    });

    // Create Athena data source
    const athenaDataSource = api.addHttpDataSource('AthenaDataSource', 'https://athena.us-west-2.amazonaws.com', {
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 'athena'
      }
    });

    // Create Bedrock data source
    const bedrockDataSource = api.addHttpDataSource('BedrockDataSource', 'https://bedrock-runtime.us-west-2.amazonaws.com', {
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 'bedrock'
      }
    });

    // Add Nova Micro specific permissions
    const bedrockRole = new iam.Role(this, 'BedrockDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    bedrockRole.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:ListFoundationModels'
      ],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`
      ]
    }));

    // Add CloudWatch logging for Nova Micro
    bedrockRole.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [logGroup.logGroupArn + ':*']
    }));

    const chatHistoryDataSource = api.addDynamoDbDataSource('ChatHistoryDataSource', chatHistoryTable);
    const csvMetadataDataSource = api.addDynamoDbDataSource('CsvMetadataDataSource', csvMetadataTable);
    const savedResultsDataSource = api.addDynamoDbDataSource('SavedResultsDataSource', savedResultsTable);
    const queryStatusDataSource = api.addDynamoDbDataSource('QueryStatusDataSource', queryStatusTable);

    // Create roles for data sources
    const chatHistoryRole = new iam.Role(this, 'ChatHistoryDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    const csvMetadataRole = new iam.Role(this, 'CsvMetadataDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    const savedResultsRole = new iam.Role(this, 'SavedResultsDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    const queryStatusRole = new iam.Role(this, 'QueryStatusDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    // Grant DynamoDB permissions to data source roles
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
        chatHistoryTable.tableArn,
        chatHistoryTable.tableArn + '/index/userId-timestamp-index',
        csvMetadataTable.tableArn,
        savedResultsTable.tableArn,
        queryStatusTable.tableArn
      ]
    });

    // Grant permissions to each data source role
    chatHistoryRole.addToPrincipalPolicy(dataSourceRolePolicy);
    csvMetadataRole.addToPrincipalPolicy(dataSourceRolePolicy);
    savedResultsRole.addToPrincipalPolicy(dataSourceRolePolicy);
    queryStatusRole.addToPrincipalPolicy(dataSourceRolePolicy);

    // Attach roles to data sources
    chatHistoryDataSource.ds.serviceRoleArn = chatHistoryRole.roleArn;
    csvMetadataDataSource.ds.serviceRoleArn = csvMetadataRole.roleArn;
    savedResultsDataSource.ds.serviceRoleArn = savedResultsRole.roleArn;
    queryStatusDataSource.ds.serviceRoleArn = queryStatusRole.roleArn;

    // Create AppSync resolvers
    csvMetadataDataSource.createResolver('UploadFile', {
      typeName: 'Mutation',
      fieldName: 'uploadFile',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/uploadFile.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/uploadFile.response.vtl')
    });

    bedrockDataSource.createResolver('ProcessQuery', {
      typeName: 'Query',
      fieldName: 'processQuery',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/processQuery.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/processQuery.response.vtl')
    });

    athenaDataSource.createResolver('ExecuteQuery', {
      typeName: 'Query',
      fieldName: 'executeQuery',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/executeQuery.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/executeQuery.response.vtl')
    });

    queryStatusDataSource.createResolver('GetQueryStatus', {
      typeName: 'Query',
      fieldName: 'getQueryStatus',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getQueryStatus.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getQueryStatus.response.vtl')
    });

    chatHistoryDataSource.createResolver('GetChatHistory', {
      typeName: 'Query',
      fieldName: 'getChatHistory',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getChatHistory.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getChatHistory.response.vtl')
    });

    savedResultsDataSource.createResolver('SaveQueryResult', {
      typeName: 'Mutation',
      fieldName: 'saveQueryResult',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/saveQueryResult.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/saveQueryResult.response.vtl')
    });

    csvMetadataDataSource.createResolver('GetUploadStatus', {
      typeName: 'Query',
      fieldName: 'getUploadStatus',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getUploadStatus.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getUploadStatus.response.vtl')
    });

    savedResultsDataSource.createResolver('GetSavedResults', {
      typeName: 'Query',
      fieldName: 'getSavedResults',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getSavedResults.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/getSavedResults.response.vtl')
    });

    savedResultsDataSource.createResolver('DeleteSavedResult', {
      typeName: 'Mutation',
      fieldName: 'deleteSavedResult',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/deleteSavedResult.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/deleteSavedResult.response.vtl')
    });

    chatHistoryDataSource.createResolver('SaveChatMessage', {
      typeName: 'Mutation',
      fieldName: 'saveChatMessage',
      requestMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/saveChatMessage.request.vtl'),
      responseMappingTemplate: appsync.MappingTemplate.fromFile('mapping-templates/saveChatMessage.response.vtl')
    });

    // Attach role to Bedrock data source
    bedrockDataSource.ds.serviceRoleArn = bedrockRole.roleArn;

    // Create outputs
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
      description: 'AppSync GraphQL API URL'
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'UploadBucketName', {
      value: uploadBucket.bucketName,
      description: 'S3 Bucket for CSV Uploads'
    });

    new cdk.CfnOutput(this, 'ResultsBucketName', {
      value: resultsBucket.bucketName,
      description: 'S3 Bucket for Query Results'
    });
  }
} 