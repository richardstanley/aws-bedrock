import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AthenaClient, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const s3 = new S3Client({});
const dynamodb = new DynamoDBClient({});
const athena = new AthenaClient({});
const cloudwatch = new CloudWatchLogsClient({});

const LOG_GROUP = '/switchblade/application';
const LOG_STREAM = 'file-upload';

interface LogEvent {
  timestamp: number;
  message: string;
  level: 'INFO' | 'ERROR' | 'WARN';
  metadata?: any;
}

async function logEvent(event: LogEvent) {
  try {
    const command = new PutLogEventsCommand({
      logGroupName: LOG_GROUP,
      logStreamName: LOG_STREAM,
      logEvents: [{
        timestamp: event.timestamp,
        message: JSON.stringify({
          level: event.level,
          message: event.message,
          metadata: event.metadata
        })
      }]
    });
    await cloudwatch.send(command);
  } catch (error) {
    console.error('Failed to write to CloudWatch:', error);
  }
}

async function updateFileStatus(fileId: string, status: string, progress?: number, error?: string) {
  try {
    await dynamodb.send(
      new PutItemCommand({
        TableName: 'csv-metadata',
        Item: {
          fileId: { S: fileId },
          status: { S: status },
          ...(progress !== undefined && { progress: { N: progress.toString() } }),
          ...(error && { error: { S: error } }),
          updatedAt: { N: Date.now().toString() }
        }
      })
    );
  } catch (error) {
    await logEvent({
      timestamp: Date.now(),
      level: 'ERROR',
      message: 'Failed to update file status',
      metadata: { fileId, error: error.message }
    });
    throw error;
  }
}

export const handler = async (event: any) => {
  const startTime = Date.now();
  const fileId = uuidv4();

  try {
    const { fileName, fileType, userId } = event.arguments.input;

    // Validate input
    if (!fileName || !fileType || !userId) {
      throw new Error('Missing required fields: fileName, fileType, or userId');
    }

    // Validate file type
    if (!fileType.startsWith('text/csv')) {
      throw new Error('Only CSV files are supported');
    }

    await logEvent({
      timestamp: startTime,
      level: 'INFO',
      message: 'Starting file upload process',
      metadata: { fileId, fileName, userId }
    });

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.UPLOAD_BUCKET,
      Key: `uploads/${userId}/${fileId}/${fileName}`,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Save file metadata
    await dynamodb.send(
      new PutItemCommand({
        TableName: 'csv-metadata',
        Item: {
          fileId: { S: fileId },
          userId: { S: userId },
          fileName: { S: fileName },
          fileType: { S: fileType },
          status: { S: 'PENDING' },
          createdAt: { N: startTime.toString() },
          updatedAt: { N: startTime.toString() }
        },
      })
    );

    await logEvent({
      timestamp: Date.now(),
      level: 'INFO',
      message: 'File upload URL generated',
      metadata: { fileId, fileName }
    });

    return {
      fileId,
      status: 'PENDING',
      uploadUrl: presignedUrl,
    };
  } catch (error) {
    const errorTime = Date.now();
    await logEvent({
      timestamp: errorTime,
      level: 'ERROR',
      message: 'File upload process failed',
      metadata: { 
        fileId, 
        error: error.message,
        duration: errorTime - startTime
      }
    });

    await updateFileStatus(fileId, 'ERROR', undefined, error.message);

    return {
      fileId,
      status: 'ERROR',
      error: error.message,
    };
  }
}; 