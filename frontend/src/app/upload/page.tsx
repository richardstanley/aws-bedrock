'use client'

import { FileUpload } from '@/components/upload/file-upload'
import { useDataMutation } from '@/hooks/use-query'

interface UploadResponse {
  success: boolean
  message?: string
}

export default function UploadPage() {
  const uploadMutation = useDataMutation<UploadResponse, Error, File>(
    async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      return response.json()
    },
    {
      onSuccess: (data) => {
        console.log('File uploaded successfully:', data)
      },
      onError: (error) => {
        console.error('Upload failed:', error)
      },
    }
  )

  const handleUpload = async (file: File) => {
    try {
      await uploadMutation.mutateAsync(file)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Upload CSV File</h1>
      <FileUpload
        onUpload={handleUpload}
        maxSize={10 * 1024 * 1024} // 10MB
      />
    </div>
  )
} 