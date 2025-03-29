import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'test/integration/.env' });

async function setupTestUser() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!userPoolId || !username || !password) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const cognitoClient = new CognitoIdentityProviderClient({});

  try {
    // Create test user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });

    await cognitoClient.send(createUserCommand);
    console.log('✅ Test user created successfully');

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);
    console.log('✅ Test user password set successfully');

    console.log('\nTest user setup complete!');
    console.log('Username:', username);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error setting up test user:', error);
    process.exit(1);
  }
}

setupTestUser(); 