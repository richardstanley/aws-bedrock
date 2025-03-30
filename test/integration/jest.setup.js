const { config } = require('dotenv');

// Load environment variables from .env file
config();

// Check for required environment variables
const requiredEnvVars = [
  'APPSYNC_API_URL',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'TEST_USERNAME',
  'TEST_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Set test timeout
jest.setTimeout(process.env.TEST_TIMEOUT || 30000); 