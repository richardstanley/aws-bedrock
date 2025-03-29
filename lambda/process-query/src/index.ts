import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AthenaClient, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const athenaClient = new AthenaClient({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { question, userId } = JSON.parse(event.body || '{}');
    const queryId = uuidv4();

    // TODO: Call Nova API to convert question to SQL
    const sqlQuery = `SELECT * FROM your_table WHERE condition = 'example'`;

    // Start Athena query
    const startQueryResponse = await athenaClient.send(
      new StartQueryExecutionCommand({
        QueryString: sqlQuery,
        WorkGroup: process.env.ATHENA_WORKGROUP,
        ResultConfiguration: {
          OutputLocation: `s3://${process.env.RESULTS_BUCKET}/athena-results/`
        }
      })
    );

    // Save to chat history
    await dynamoClient.send(
      new PutItemCommand({
        TableName: 'chat-history',
        Item: {
          userId: { S: userId },
          messageId: { S: queryId },
          question: { S: question },
          timestamp: { N: Date.now().toString() },
          status: { S: 'PROCESSING' }
        }
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        queryId,
        status: 'PROCESSING'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        queryId: uuidv4(),
        status: 'ERROR',
        message: 'Internal server error'
      })
    };
  }
}; 