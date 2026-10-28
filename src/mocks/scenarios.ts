import { delay, HttpResponse } from 'msw'
import { errorResponse } from './utils'

export const SCENARIOS = [
  'default',
  'empty',
  'slow',
  'variable-latency',
  'timeout',
  'offline',
  'server-error',
  'flaky',
  'payment-declined',
  'wallet-rejected',
] as const

export type ScenarioName = (typeof SCENARIOS)[number]

const STORAGE_KEY = 'nft-marketplace:scenario'

export function isScenario(value: string | null): value is ScenarioName {
  return value !== null && (SCENARIOS as readonly string[]).includes(value)
}

export function getScenario(): ScenarioName {
  if (typeof localStorage === 'undefined') return 'default'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isScenario(stored) ? stored : 'default'
}

export function setScenario(name: ScenarioName): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, name)
  latencyStep = 0
  flakySeen.clear()
}

const VARIABLE_LATENCIES_MS = [1800, 100, 900, 50]
let latencyStep = 0
const flakySeen = new Set<string>()

export async function applyScenario(request: Request): Promise<Response | undefined> {
  switch (getScenario()) {
    case 'slow':
      await delay(2500)
      return undefined
    case 'variable-latency':
      await delay(VARIABLE_LATENCIES_MS[latencyStep++ % VARIABLE_LATENCIES_MS.length])
      return undefined
    case 'timeout':
      await delay('infinite')
      return undefined
    case 'offline':
      return HttpResponse.error()
    case 'server-error':
      return errorResponse(500, 'INTERNAL_ERROR', 'Erro interno simulado pelo cenário "server-error".')
    case 'flaky': {
      const key = `${request.method} ${request.url}`
      if (!flakySeen.has(key)) {
        flakySeen.add(key)
        return errorResponse(503, 'UNAVAILABLE', 'Serviço indisponível (falha transitória simulada).')
      }
      return undefined
    }
    default:
      await delay(200)
      return undefined
  }
}
