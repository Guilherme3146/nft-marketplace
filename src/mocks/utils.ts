import { HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/api'
import { getDb, GUEST_USER_ID } from './db'

/**
 * O prefixo "*" casa qualquer origem (localhost, Vercel...) e funciona
 * tanto no navegador quanto no Node (testes).
 */
export const apiPath = (path: string) => `*/api${path}`

/**
 * Lê o header "Authorization: Bearer <token>", acha a sessão correspondente
 * e devolve o userId dono dela. Sem token válido, devolve o "usuário" convidado
 * — é assim que favoritos/carrinho continuam funcionando antes do login.
 */
export function resolveUserId(request: Request): string {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  const userId = token ? getDb().sessions[token] : undefined
  return userId ?? GUEST_USER_ID
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
) {
  const body: ApiErrorBody = { error: { code, message, details } }
  return HttpResponse.json(body, { status })
}
