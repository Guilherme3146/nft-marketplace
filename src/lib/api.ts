import axios from 'axios'
import { getToken } from '@/features/auth/token'

/** Formato de erro que TODA resposta de erro da API (real ou simulada) segue. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    /** Erros de validação por campo: { email: ["E-mail já cadastrado"] } */
    details?: Record<string, string[]>
  }
}

/**
 * Erro normalizado: a interface nunca lida com AxiosError diretamente.
 * status === 0 significa "sem resposta" (rede caiu, timeout, bloqueio).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, string[]>

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Único cliente HTTP da aplicação. Toda chamada REST passa por aqui. */
export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  // category=art&category=music (em vez de category[]=art&category[]=music)
  paramsSerializer: { indexes: null },
})

/** "Interceptor de pedido": roda ANTES de toda chamada sair, pra grudar o crachá nela. */
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Requisição cancelada de propósito (ex.: resposta obsoleta): não é um erro "de verdade".
    if (axios.isCancel(error)) return Promise.reject(error)

    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const status = error.response?.status ?? 0
      const body = error.response?.data?.error
      const fallbackCode = error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'
      return Promise.reject(
        new ApiError(
          status,
          body?.code ?? fallbackCode,
          body?.message ?? 'Não foi possível falar com o servidor.',
          body?.details,
        ),
      )
    }
    return Promise.reject(error)
  },
)

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
