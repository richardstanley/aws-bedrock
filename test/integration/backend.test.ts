import { GraphQLClient, gql } from 'graphql-request';
import { config } from 'dotenv';
import {
  UploadFileResponse,
  GetUploadStatusResponse,
  ProcessQueryResponse,
  GetChatHistoryResponse
} from './types';

// Load environment variables
config();

const API_URL = process.env.APPSYNC_API_URL;
const API_KEY = process.env.APPSYNC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: APPSYNC_API_URL, APPSYNC_API_KEY');
}

const client = new GraphQLClient(API_URL, {
  headers: {
    'x-api-key': API_KEY,
  },
});

describe('Backend Integration Tests', () => {
  const testUserId = 'test-user-' + Date.now();

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
  });
}); 