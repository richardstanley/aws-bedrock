import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('process-query Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    body: JSON.stringify({
      question: 'What is the total revenue for each product?',
      userId: 'test-user-123'
    }),
    headers: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/process-query',
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
    process.env.ATHENA_WORKGROUP = 'test-workgroup';
    process.env.ATHENA_OUTPUT_BUCKET = 'test-output-bucket';
  });

  test('should process valid query', async () => {
    const response = await handler(mockEvent);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('queryId');
    expect(body).toHaveProperty('status', 'PROCESSING');
  });

  test('should handle missing question', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({
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
        question: 'What is the total revenue for each product?'
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