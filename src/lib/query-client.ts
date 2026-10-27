import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api'

/**
 * POLÍTICA DE CACHE / RETRY (documente isto no ARCHITECTURE.md):
 * - staleTime 30s: dentro desse tempo a mesma consulta não vai à rede de novo.
 * - gcTime 5min: dados sem uso ficam em memória por 5 minutos.
 * - retry: só para falhas transitórias (sem resposta, 408, 429, 5xx), no máximo 2x.
 *   Erros 4xx (validação, 401, 403, 404, 409) NÃO repetem: repetir não muda o resultado.
 * - mutations nunca repetem sozinhas: repetir uma compra por conta própria
 *   poderia duplicar o pedido (a idempotência cobre o reenvio manual).
 */
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
