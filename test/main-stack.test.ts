import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MainStack } from '../lib/stacks/main-stack';

describe('MainStack', () => {
  const app = new cdk.App();
  const stack = new MainStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  test('has S3 buckets', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          [
            'query-results-',
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' }
          ]
        ]
      }
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          [
            'csv-uploads-',
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' }
          ]
        ]
      }
    });
  });

  test('has DynamoDB tables', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'chat-history'
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'user-preferences'
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'csv-metadata'
    });
  });

  test('has Cognito User Pool', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'switchblade-user-pool'
    });
  });

  test('has Athena Workgroup', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      Name: 'switchblade-workgroup'
    });
  });

  test('has CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/switchblade/application'
    });
  });

  test('has Lambda execution role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            }
          }
        ]
      }
    });
  });
}); 