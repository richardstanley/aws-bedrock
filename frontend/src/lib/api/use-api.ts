'use client'

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { API_BASE_URL, getHeaders, handleApiError, requestInterceptor, responseInterceptor } from './client'

// Generic GET request
export async function get<T>(endpoint: string, token?: string): Promise<T> {
  const config = await requestInterceptor({
    method: 'GET',
    headers: getHeaders(token),
  })
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const interceptedResponse = await responseInterceptor(response)
  return handleApiError(interceptedResponse)
}

// Generic POST request
export async function post<T, V>(endpoint: string, data: V, token?: string): Promise<T> {
  const config = await requestInterceptor({
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const interceptedResponse = await responseInterceptor(response)
  return handleApiError(interceptedResponse)
}

// Custom hook for queries
export function useApiQuery<TData = unknown, TError = unknown>(
  key: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: () => get<TData>(endpoint),
    ...options,
  })
}

// Custom hook for mutations
export function useApiMutation<TData = unknown, TError = unknown, TVariables = void>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => post<TData, TVariables>(endpoint, variables),
    ...options,
  })
} 