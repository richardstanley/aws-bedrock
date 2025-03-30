#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/stacks/main-stack';

const app = new cdk.App();

// Get environment from context or use default
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
};

// Create the main stack
new MainStack(app, 'SwitchbladeStack', {
  env,
  description: 'Switchblade Athena API Stack'
}); 