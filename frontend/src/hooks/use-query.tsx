'use client'

import { QueryClient, QueryClientProvider, useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
})

// Create a provider
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom hook for data fetching
export function useDataQuery<TData = unknown, TError = unknown>(
  key: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn,
    ...options,
  })
}

// Custom hook for mutations
export function useDataMutation<TData = unknown, TError = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  })
} 