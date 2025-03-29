import { useState, useCallback } from 'react'

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      startLoading()
      return await promise
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  }
}

// Example usage:
// const { isLoading, withLoading } = useLoading()
// 
// const handleSubmit = async () => {
//   await withLoading(someAsyncOperation())
// } 