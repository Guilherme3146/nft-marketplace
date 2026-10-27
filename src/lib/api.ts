import axios from 'axios'
import { getToken } from '@/features/auth/token'

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

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

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  paramsSerializer: { indexes: null },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
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
