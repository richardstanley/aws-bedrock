import { useState, useCallback } from 'react'

interface ErrorState {
  message: string
  code?: string
  details?: unknown
}

export function useErrorHandling() {
  const [error, setError] = useState<ErrorState | null>(null)

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError({
        message: error.message,
        details: error,
      })
    } else if (typeof error === 'string') {
      setError({
        message: error,
      })
    } else {
      setError({
        message: 'An unexpected error occurred',
        details: error,
      })
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError,
  }
}

// Example usage:
// const { error, handleError, clearError } = useErrorHandling()
// 
// try {
//   // Some async operation
// } catch (err) {
//   handleError(err)
// } 