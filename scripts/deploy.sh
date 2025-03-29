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

# Deploy the stack
echo "Deploying stack..."
npx cdk deploy \
  --require-approval never \
  --profile sunnyhill \
  --outputs-file cdk-outputs.json

# Update integration test environment variables
echo "Updating integration test environment variables..."
API_URL=$(jq -r '.SwitchbladeStack.GraphQLAPIURL' cdk-outputs.json)

cat > test/integration/.env << EOF
# AppSync API Configuration
APPSYNC_API_URL=$API_URL

# Optional: Test Configuration
TEST_TIMEOUT=30000
EOF

# Setup frontend development environment
echo "Setting up frontend development environment..."
./scripts/deploy-frontend.sh

echo "Development environment setup complete!"
echo "Backend API URL: $API_URL"
echo "Frontend: Run 'cd frontend && npm run dev' to start the development server" 