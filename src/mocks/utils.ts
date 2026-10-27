import { HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/api'

/**
 * O prefixo "*" casa qualquer origem (localhost, Vercel...) e funciona
 * tanto no navegador quanto no Node (testes).
 */
export const apiPath = (path: string) => `*/api${path}`

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
) {
  const body: ApiErrorBody = { error: { code, message, details } }
  return HttpResponse.json(body, { status })
}
