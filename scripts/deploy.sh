#!/bin/bash

# Exit on error
set -e

# Check if AWS profile exists
if ! aws configure list-profiles | grep -q "^sunnyhill$"; then
  echo "Error: AWS profile 'sunnyhill' not found"
  echo "Please configure the profile using 'aws configure --profile sunnyhill'"
  exit 1
fi

# Set AWS profile
export AWS_PROFILE=sunnyhill

# Get account info
echo "Getting AWS account info..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region --profile sunnyhill)

echo "Using AWS Profile: sunnyhill"
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Build the project
echo "Building project..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Bootstrap CDK (if not already done)
echo "Bootstrapping CDK..."
npx cdk bootstrap aws://$ACCOUNT_ID/$REGION

# Deploy the stack
echo "Deploying stack..."
npx cdk deploy \
  --require-approval never \
  --profile sunnyhill \
  --outputs-file cdk-outputs.json

echo "Deployment complete!"
echo "Outputs saved to cdk-outputs.json" 