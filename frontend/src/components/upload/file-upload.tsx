'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUpload({ onUpload, accept = { 'text/csv': ['.csv'] }, maxSize = 5242880 }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setProgress(0)
      await onUpload(file)
      setProgress(100)
      setFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const removeFile = () => {
    setFile(null)
    setProgress(0)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop the file here'
            : 'Drag and drop a CSV file here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Maximum file size: {maxSize / 1024 / 1024}MB
        </p>
      </div>

      {file && (
        <div className="mt-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Uploading... {progress}%
              </p>
            </div>
          )}
          {!uploading && (
            <Button
              onClick={handleUpload}
              className="mt-2 w-full"
            >
              Upload File
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 