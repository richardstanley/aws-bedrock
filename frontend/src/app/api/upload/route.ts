import { NextResponse } from 'next/server';
import { getCurrentSession, getIdToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the Cognito ID token for AppSync authorization
    const idToken = await getIdToken();
    if (!idToken) {
      return NextResponse.json({ error: 'Failed to get authorization token' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileType, userId } = body;

    if (!fileName || !fileType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await fetch(process.env.NEXT_PUBLIC_APPSYNC_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken
      },
      body: JSON.stringify({
        query: `
          mutation UploadFile($input: UploadFileInput!) {
            uploadFile(input: $input) {
              fileId
              uploadUrl
              status
              error
            }
          }
        `,
        variables: {
          input: {
            fileName,
            fileType,
            userId,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return NextResponse.json(data.data.uploadFile);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload request' },
      { status: 500 }
    );
  }
} 