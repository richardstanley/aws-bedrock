import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('upload-file Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    body: JSON.stringify({
      fileName: 'test.csv',
      fileType: 'text/csv',
      userId: 'test-user-123'
    }),
    headers: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/upload-file',
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {} as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env.UPLOAD_BUCKET = 'test-upload-bucket';
  });

  test('should generate presigned URL for valid file', async () => {
    const response = await handler(mockEvent);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('fileId');
    expect(body).toHaveProperty('uploadUrl');
    expect(body).toHaveProperty('status', 'PENDING');
  });

  test('should handle missing fileName', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({
        fileType: 'text/csv',
        userId: 'test-user-123'
      })
    };

    const response = await handler(invalidEvent);
    
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ERROR');
    expect(body).toHaveProperty('message');
  });

  test('should handle missing fileType', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({
        fileName: 'test.csv',
        userId: 'test-user-123'
      })
    };

    const response = await handler(invalidEvent);
    
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ERROR');
    expect(body).toHaveProperty('message');
  });

  test('should handle missing userId', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({
        fileName: 'test.csv',
        fileType: 'text/csv'
      })
    };

    const response = await handler(invalidEvent);
    
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ERROR');
    expect(body).toHaveProperty('message');
  });

  test('should handle invalid JSON body', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: 'invalid-json'
    };

    const response = await handler(invalidEvent);
    
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ERROR');
    expect(body).toHaveProperty('message');
  });
}); 