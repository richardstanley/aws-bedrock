import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { fileName, fileType, userId } = JSON.parse(event.body || '{}');
    const fileId = uuidv4();
    const key = `uploads/${userId}/${fileId}/${fileName}`;

    // Generate presigned URL for file upload
    const putCommand = new PutObjectCommand({
      Bucket: process.env.UPLOAD_BUCKET,
      Key: key,
      ContentType: fileType
    });

    const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });

    // Save file metadata
    await dynamoClient.send(
      new PutItemCommand({
        TableName: 'csv-metadata',
        Item: {
          userId: { S: userId },
          fileId: { S: fileId },
          fileName: { S: fileName },
          fileType: { S: fileType },
          status: { S: 'PENDING' },
          timestamp: { N: Date.now().toString() }
        }
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        fileId,
        uploadUrl: presignedUrl,
        status: 'PENDING'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        fileId: uuidv4(),
        status: 'ERROR',
        message: 'Internal server error'
      })
    };
  }
}; 