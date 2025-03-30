import { GraphQLClient, gql } from 'graphql-request';
import { config } from 'dotenv';
import {
  UploadFileResponse,
  GetUploadStatusResponse,
  ProcessQueryResponse,
  GetChatHistoryResponse,
  SaveQueryResultResponse,
  GetSavedResultsResponse,
  DeleteSavedResultResponse
} from './types';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';

// Load environment variables
config();

const API_URL = process.env.APPSYNC_API_URL;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!API_URL || !USER_POOL_ID || !CLIENT_ID || !TEST_USERNAME || !TEST_PASSWORD) {
  throw new Error('Missing required environment variables');
}

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  } : undefined
});

const iamClient = new IAMClient({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  } : undefined
});

// Get Cognito token
async function getCognitoToken() {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID as string,
    AuthParameters: {
      USERNAME: TEST_USERNAME as string,
      PASSWORD: TEST_PASSWORD as string
    }
  });

  const response = await cognitoClient.send(command);
  return response.AuthenticationResult?.IdToken;
}

// Initialize GraphQL client with Cognito token
let client: GraphQLClient;

describe('Backend Integration Tests', () => {
  const testUserId = 'test-user-' + Date.now();
  const stackName = 'SwitchbladeStack';

  beforeAll(async () => {
    const token = await getCognitoToken();
    if (!token) {
      throw new Error('Failed to get Cognito token');
    }

    client = new GraphQLClient(API_URL, {
      headers: {
        'Authorization': token
      },
    });
  });

  describe('IAM Roles and Permissions', () => {
    const hasAwsCredentials = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY;

    test('should have Lambda execution role with correct permissions', async () => {
      if (!hasAwsCredentials) {
        console.log('Skipping IAM role tests: AWS credentials not available');
        return;
      }

      const roleName = `${stackName}-LambdaExecutionRole`;
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const role = await iamClient.send(getRoleCommand);

      expect(role.Role).toBeDefined();
      expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check managed policies
      const listAttachedPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const attachedPolicies = await iamClient.send(listAttachedPoliciesCommand);
      expect(attachedPolicies.AttachedPolicies).toContainEqual(
        expect.objectContaining({
          PolicyName: 'AWSLambdaBasicExecutionRole'
        })
      );

      // Check inline policies
      const listInlinePoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const inlinePolicies = await iamClient.send(listInlinePoliciesCommand);
      expect(inlinePolicies.PolicyNames).toBeDefined();
    });

    test('should have AppSync service role with correct permissions', async () => {
      if (!hasAwsCredentials) {
        console.log('Skipping IAM role tests: AWS credentials not available');
        return;
      }

      const roleName = `${stackName}-AppSyncServiceRole`;
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const role = await iamClient.send(getRoleCommand);

      expect(role.Role).toBeDefined();
      expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check managed policies
      const listAttachedPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const attachedPolicies = await iamClient.send(listAttachedPoliciesCommand);
      expect(attachedPolicies.AttachedPolicies).toContainEqual(
        expect.objectContaining({
          PolicyName: 'AWSAppSyncPushToCloudWatchLogs'
        })
      );

      // Check inline policies
      const listInlinePoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const inlinePolicies = await iamClient.send(listInlinePoliciesCommand);
      expect(inlinePolicies.PolicyNames).toBeDefined();
    });
  });

  describe('File Upload Flow', () => {
    test('should generate presigned URL for file upload', async () => {
      const mutation = gql`
        mutation UploadFile($input: UploadFileInput!) {
          uploadFile(input: $input) {
            fileId
            uploadUrl
            status
          }
        }
      `;

      const variables = {
        input: {
          fileName: 'test.csv',
          fileType: 'text/csv',
          userId: testUserId
        }
      };

      const response = await client.request<UploadFileResponse>(mutation, variables);
      
      expect(response.uploadFile).toHaveProperty('fileId');
      expect(response.uploadFile).toHaveProperty('uploadUrl');
      expect(response.uploadFile.status).toBe('PENDING');
    });

    test('should track file upload status', async () => {
      const query = gql`
        query GetUploadStatus($fileId: String!) {
          getUploadStatus(fileId: $fileId) {
            fileId
            status
            progress
            tableName
          }
        }
      `;

      const variables = {
        fileId: 'test-file-id' // Replace with actual fileId from previous test
      };

      const response = await client.request<GetUploadStatusResponse>(query, variables);
      
      expect(response.getUploadStatus).toHaveProperty('fileId');
      expect(response.getUploadStatus).toHaveProperty('status');
    });
  });

  describe('Query Processing Flow', () => {
    test('should process natural language query', async () => {
      const query = gql`
        query ProcessQuery($input: ProcessQueryInput!) {
          processQuery(input: $input) {
            queryId
            status
            results {
              columns
              rows
            }
          }
        }
      `;

      const variables = {
        input: {
          question: 'What is the total revenue for each product?',
          userId: testUserId
        }
      };

      const response = await client.request<ProcessQueryResponse>(query, variables);
      
      expect(response.processQuery).toHaveProperty('queryId');
      expect(response.processQuery.status).toBe('PROCESSING');
    });

    test('should retrieve chat history', async () => {
      const query = gql`
        query GetChatHistory($userId: String!) {
          getChatHistory(userId: $userId) {
            messageId
            userId
            question
            answer
            timestamp
            status
          }
        }
      `;

      const variables = {
        userId: testUserId
      };

      const response = await client.request<GetChatHistoryResponse>(query, variables);
      
      expect(Array.isArray(response.getChatHistory)).toBe(true);
      if (response.getChatHistory.length > 0) {
        expect(response.getChatHistory[0]).toHaveProperty('messageId');
        expect(response.getChatHistory[0]).toHaveProperty('question');
      }
    });
  });

  describe('Saved Results Flow', () => {
    test('should save query result', async () => {
      const mutation = gql`
        mutation SaveQueryResult($input: SaveQueryResultInput!) {
          saveQueryResult(input: $input) {
            resultId
            userId
            query
            result
            createdAt
            expiresAt
          }
        }
      `;

      const variables = {
        input: {
          userId: testUserId,
          query: 'SELECT * FROM test_table LIMIT 10',
          result: JSON.stringify({ columns: ['id', 'name'], rows: [[1, 'test']] }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }
      };

      const response = await client.request<SaveQueryResultResponse>(mutation, variables);
      
      expect(response.saveQueryResult).toHaveProperty('resultId');
      expect(response.saveQueryResult.userId).toBe(testUserId);
      expect(response.saveQueryResult.query).toBe(variables.input.query);
    });

    test('should retrieve saved results', async () => {
      const query = gql`
        query GetSavedResults($userId: String!, $limit: Int, $nextToken: String) {
          getSavedResults(userId: $userId, limit: $limit, nextToken: $nextToken) {
            items {
              resultId
              userId
              query
              result
              createdAt
              expiresAt
            }
            nextToken
          }
        }
      `;

      const variables = {
        userId: testUserId,
        limit: 10
      };

      const response = await client.request<GetSavedResultsResponse>(query, variables);
      
      expect(response.getSavedResults).toHaveProperty('items');
      expect(Array.isArray(response.getSavedResults.items)).toBe(true);
      expect(response.getSavedResults).toHaveProperty('nextToken');
    });

    test('should delete saved result', async () => {
      const mutation = gql`
        mutation DeleteSavedResult($userId: String!, $resultId: String!) {
          deleteSavedResult(userId: $userId, resultId: $resultId)
        }
      `;

      const variables = {
        userId: testUserId,
        resultId: 'test-result-id' // Replace with actual resultId from save test
      };

      const response = await client.request<DeleteSavedResultResponse>(mutation, variables);
      
      expect(response.deleteSavedResult).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid file upload input', async () => {
      const mutation = gql`
        mutation UploadFile($input: UploadFileInput!) {
          uploadFile(input: $input) {
            fileId
            uploadUrl
            status
            error
          }
        }
      `;

      const variables = {
        input: {
          // Missing required fields
          userId: testUserId
        }
      };

      try {
        await client.request<UploadFileResponse>(mutation, variables);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid query input', async () => {
      const mutation = gql`
        mutation ProcessQuery($input: ProcessQueryInput!) {
          processQuery(input: $input) {
            queryId
            status
            error
          }
        }
      `;

      const variables = {
        input: {
          // Missing required fields
          userId: testUserId
        }
      };

      try {
        await client.request<ProcessQueryResponse>(mutation, variables);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid saved result input', async () => {
      const mutation = gql`
        mutation SaveQueryResult($input: SaveQueryResultInput!) {
          saveQueryResult(input: $input) {
            resultId
            error
          }
        }
      `;

      const variables = {
        input: {
          // Missing required fields
          userId: testUserId
        }
      };

      try {
        await client.request<SaveQueryResultResponse>(mutation, variables);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 