import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const athena = new AthenaClient({});
const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

interface NovaResponse {
  sql: string;
  explanation: string;
}

async function callNovaAPI(question: string): Promise<NovaResponse> {
  const response = await fetch('https://api.nova.ai/v1/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NOVA_API_KEY}`,
    },
    body: JSON.stringify({
      question,
      dialect: 'athena',
      context: {
        database: 'default',
        schema: 'public'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Nova API error: ${response.statusText}`);
  }

  return response.json();
}

async function executeAthenaQuery(sql: string): Promise<any> {
  const startQueryCommand = new StartQueryExecutionCommand({
    QueryString: sql,
    WorkGroup: process.env.ATHENA_WORKGROUP,
    ResultConfiguration: {
      OutputLocation: `s3://${process.env.RESULTS_BUCKET}/athena-results/`
    }
  });

  const queryExecution = await athena.send(startQueryCommand);
  const queryExecutionId = queryExecution.QueryExecutionId;

  // Wait for query to complete
  let queryStatus = 'RUNNING';
  while (queryStatus === 'RUNNING') {
    const getQueryExecutionCommand = new GetQueryExecutionCommand({
      QueryExecutionId: queryExecutionId
    });
    const queryExecutionResult = await athena.send(getQueryExecutionCommand);
    queryStatus = queryExecutionResult.QueryExecution?.Status?.State || 'FAILED';
    
    if (queryStatus === 'FAILED') {
      throw new Error('Query execution failed');
    }
    
    if (queryStatus === 'SUCCEEDED') {
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get query results
  const getQueryResultsCommand = new GetQueryResultsCommand({
    QueryExecutionId: queryExecutionId
  });
  const results = await athena.send(getQueryResultsCommand);

  return results;
}

async function saveChatMessage(userId: string, question: string, answer: string, status: string, error?: string) {
  const messageId = uuidv4();
  const timestamp = Date.now();

  await dynamodb.send(
    new PutItemCommand({
      TableName: 'chat-history',
      Item: {
        messageId: { S: messageId },
        userId: { S: userId },
        question: { S: question },
        answer: { S: answer },
        timestamp: { N: timestamp.toString() },
        status: { S: status },
        ...(error && { error: { S: error } })
      }
    })
  );

  return {
    messageId,
    userId,
    question,
    answer,
    timestamp: timestamp.toString(),
    status,
    error
  };
}

export const handler = async (event: any) => {
  try {
    const { question, userId } = event.arguments.input;
    const queryId = uuidv4();

    // Call Nova API to convert question to SQL
    const novaResponse = await callNovaAPI(question);
    const sql = novaResponse.sql;

    // Execute the query in Athena
    const queryResults = await executeAthenaQuery(sql);

    // Process and format results
    const columns = queryResults.ResultSet?.Rows[0]?.Data?.map((col: any) => col.VarCharValue) || [];
    const rows = queryResults.ResultSet?.Rows.slice(1).map((row: any) => 
      row.Data.map((col: any) => col.VarCharValue)
    ) || [];

    // Save chat message
    await saveChatMessage(
      userId,
      question,
      JSON.stringify({ sql, results: { columns, rows } }),
      'COMPLETED'
    );

    return {
      queryId,
      status: 'COMPLETED',
      results: {
        columns,
        rows
      }
    };
  } catch (error) {
    console.error('Error processing query:', error);

    // Save error message
    await saveChatMessage(
      event.arguments.input.userId,
      event.arguments.input.question,
      '',
      'ERROR',
      error.message
    );

    return {
      queryId: uuidv4(),
      status: 'ERROR',
      error: error.message
    };
  }
}; 