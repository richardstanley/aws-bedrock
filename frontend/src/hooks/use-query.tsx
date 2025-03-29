import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
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