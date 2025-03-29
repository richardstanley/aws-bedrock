import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AthenaClient, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { config } from 'dotenv';

// Load environment variables
config();

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const athenaClient = new AthenaClient({ region: process.env.AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

async function testS3Buckets() {
  console.log('Testing S3 buckets...');
  
  // Test query results bucket
  const resultsBucket = process.env.QUERY_RESULTS_BUCKET;
  const testKey = 'test/query-results.txt';
  const testContent = 'Test query results';
  
  try {
    // Test write
    await s3Client.send(new PutObjectCommand({
      Bucket: resultsBucket,
      Key: testKey,
      Body: testContent
    }));
    console.log('✅ Successfully wrote to query results bucket');
    
    // Test read
    const readResult = await s3Client.send(new GetObjectCommand({
      Bucket: resultsBucket,
      Key: testKey
    }));
    console.log('✅ Successfully read from query results bucket');
  } catch (error) {
    console.error('❌ S3 query results bucket test failed:', error);
  }
  
  // Test upload bucket
  const uploadBucket = process.env.UPLOAD_BUCKET;
  const uploadKey = 'test/upload.txt';
  const uploadContent = 'Test upload content';
  
  try {
    // Test write
    await s3Client.send(new PutObjectCommand({
      Bucket: uploadBucket,
      Key: uploadKey,
      Body: uploadContent
    }));
    console.log('✅ Successfully wrote to upload bucket');
    
    // Test read
    const readResult = await s3Client.send(new GetObjectCommand({
      Bucket: uploadBucket,
      Key: uploadKey
    }));
    console.log('✅ Successfully read from upload bucket');
  } catch (error) {
    console.error('❌ S3 upload bucket test failed:', error);
  }
}

async function testDynamoDBTables() {
  console.log('Testing DynamoDB tables...');
  
  // Test chat history table
  const chatTable = process.env.CHAT_HISTORY_TABLE;
  const testItem = {
    TableName: chatTable,
    Item: {
      userId: { S: 'test-user' },
      timestamp: { N: Date.now().toString() },
      message: { S: 'Test message' }
    }
  };
  
  try {
    // Test write
    await dynamoClient.send(new PutItemCommand(testItem));
    console.log('✅ Successfully wrote to chat history table');
    
    // Test read
    const readResult = await dynamoClient.send(new GetItemCommand({
      TableName: chatTable,
      Key: {
        userId: { S: 'test-user' },
        timestamp: { N: testItem.Item.timestamp.N }
      }
    }));
    console.log('✅ Successfully read from chat history table');
  } catch (error) {
    console.error('❌ DynamoDB chat history table test failed:', error);
  }
}

async function testAthena() {
  console.log('Testing Athena...');
  
  const testQuery = 'SELECT 1';
  const workgroup = process.env.ATHENA_WORKGROUP;
  
  try {
    const command = new StartQueryExecutionCommand({
      QueryString: testQuery,
      WorkGroup: workgroup,
      ResultConfiguration: {
        OutputLocation: `s3://${process.env.QUERY_RESULTS_BUCKET}/athena-results/`
      }
    });
    
    const response = await athenaClient.send(command);
    console.log('✅ Successfully started Athena query');
    console.log('Query Execution ID:', response.QueryExecutionId);
  } catch (error) {
    console.error('❌ Athena test failed:', error);
  }
}

async function testCognito() {
  console.log('Testing Cognito...');
  
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  
  if (!userPoolId || !clientId || !username || !password) {
    console.error('❌ Missing required Cognito environment variables');
    return;
  }
  
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });
    
    const response = await cognitoClient.send(command);
    console.log('✅ Successfully authenticated with Cognito');
    console.log('Access Token:', response.AuthenticationResult?.AccessToken);
  } catch (error) {
    console.error('❌ Cognito test failed:', error);
  }
}

async function runAllTests() {
  console.log('Starting backend integration tests...\n');
  
  await testS3Buckets();
  console.log('\n');
  
  await testDynamoDBTables();
  console.log('\n');
  
  await testAthena();
  console.log('\n');
  
  await testCognito();
  
  console.log('\nBackend integration tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 