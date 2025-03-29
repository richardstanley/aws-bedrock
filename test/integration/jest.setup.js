const { config } = require('dotenv');

// Load environment variables from .env file
config();

// Increase timeout for integration tests
jest.setTimeout(30000);

// Verify required environment variables
const requiredEnvVars = ['APPSYNC_API_URL', 'APPSYNC_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
} 