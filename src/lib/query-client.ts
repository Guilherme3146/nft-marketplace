import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api'

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (!isApiError(error)) return false
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
})
