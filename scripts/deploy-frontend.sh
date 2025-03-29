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

# Build the frontend
echo "Building frontend..."
cd frontend
npm install
npm run build

# Create frontend environment file
echo "Creating frontend environment file..."
cat > .env.local << EOF
# AppSync API Configuration
NEXT_PUBLIC_APPSYNC_API_URL=$(jq -r '.SwitchbladeStack.GraphQLAPIURL' ../cdk-outputs.json)

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(jq -r '.SwitchbladeStack.UserPoolId' ../cdk-outputs.json)
NEXT_PUBLIC_COGNITO_CLIENT_ID=$(jq -r '.SwitchbladeStack.UserPoolClientId' ../cdk-outputs.json)

# S3 Configuration
NEXT_PUBLIC_UPLOAD_BUCKET_NAME=csv-uploads-${ACCOUNT_ID}-${REGION}
NEXT_PUBLIC_RESULTS_BUCKET_NAME=query-results-${ACCOUNT_ID}-${REGION}

# Development Configuration
NEXT_PUBLIC_IS_DEVELOPMENT=true
EOF

echo "Frontend development setup complete!"
echo "Run 'npm run dev' in the frontend directory to start the development server" 