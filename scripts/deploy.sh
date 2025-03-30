#!/bin/bash

# Exit on error
set -e

# Parse command line arguments
DESTROY=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --destroy) DESTROY=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

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

# Destroy existing stack if requested
if [ "$DESTROY" = true ]; then
  echo "Destroying existing stack..."
  npx cdk destroy --force --profile sunnyhill || true
fi

# Deploy the stack
echo "Deploying stack..."
npx cdk deploy \
  --require-approval never \
  --profile sunnyhill \
  --outputs-file cdk-outputs.json

# Update integration test environment variables
echo "Updating integration test environment variables..."
API_URL=$(jq -r '.SwitchbladeStack.GraphQLAPIURL' cdk-outputs.json)

# Read existing Cognito configuration if it exists
if [ -f test/integration/.env ]; then
  COGNITO_USER_POOL_ID=$(grep "^COGNITO_USER_POOL_ID=" test/integration/.env | cut -d'=' -f2)
  COGNITO_CLIENT_ID=$(grep "^COGNITO_CLIENT_ID=" test/integration/.env | cut -d'=' -f2)
  TEST_USERNAME=$(grep "^TEST_USERNAME=" test/integration/.env | cut -d'=' -f2)
  TEST_PASSWORD=$(grep "^TEST_PASSWORD=" test/integration/.env | cut -d'=' -f2)
  AWS_REGION=$(grep "^AWS_REGION=" test/integration/.env | cut -d'=' -f2)
  AWS_ACCOUNT_ID=$(grep "^AWS_ACCOUNT_ID=" test/integration/.env | cut -d'=' -f2)
else
  # Default values if .env doesn't exist
  COGNITO_USER_POOL_ID=""
  COGNITO_CLIENT_ID=""
  TEST_USERNAME=""
  TEST_PASSWORD=""
  AWS_REGION=$REGION
  AWS_ACCOUNT_ID=$ACCOUNT_ID
fi

cat > test/integration/.env << EOF
# AppSync API Configuration
APPSYNC_API_URL=$API_URL

# Cognito Configuration
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID

# Test User Configuration
TEST_USERNAME=$TEST_USERNAME
TEST_PASSWORD=$TEST_PASSWORD

# Optional: Test Configuration
TEST_TIMEOUT=30000

# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
EOF

# Setup frontend development environment
echo "Setting up frontend development environment..."
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh

echo "Development environment setup complete!"
echo "Backend API URL: $API_URL"
echo "Frontend: Run 'cd frontend && npm run dev' to start the development server" 