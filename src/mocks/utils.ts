import { HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/api'
import { getDb, GUEST_USER_ID } from './db'

export const apiPath = (path: string) => `*/api${path}`

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
