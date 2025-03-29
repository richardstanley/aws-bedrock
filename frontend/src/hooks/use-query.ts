'use client'

import { useQuery, useMutation } from '@tanstack/react-query'

// Custom hook for data fetching
export function useDataQuery<T>(key: string[], queryFn: () => Promise<T>) {
  return useQuery({
    queryKey: key,
    queryFn,
  })
}

// Custom hook for mutations
export function useDataMutation<T, V>(mutationFn: (data: V) => Promise<T>) {
  return useMutation({
    mutationFn,
  })
} 