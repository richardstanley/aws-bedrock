import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../auth/AuthProvider';

interface FileUploadProps {
  onUploadComplete: (fileId: string) => void;
  onError: (error: string) => void;
}

export function FileUpload({ onUploadComplete, onError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      onError('User not authenticated');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(0);

      // Get presigned URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          userId: user.username,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { fileId, uploadUrl } = await response.json();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setProgress(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      onUploadComplete(fileId);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [user, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Uploading... {Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the CSV file here'
                : 'Drag and drop a CSV file here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">Only CSV files are supported</p>
          </div>
        )}
      </div>
    </div>
  );
} 