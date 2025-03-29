'use client'

import { QueryClient } from '@tanstack/react-query'

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// API base URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Common headers
export const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

// Error handling middleware
export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'An error occurred')
  }
  return response.json()
}

// Request interceptor
export const requestInterceptor = async (config: RequestInit) => {
  // Add any request modifications here
  return config
}

// Response interceptor
export const responseInterceptor = async (response: Response) => {
  // Add any response modifications here
  return response
} 