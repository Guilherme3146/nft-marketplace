import { delay, HttpResponse } from 'msw'
import { errorResponse } from './utils'

/**
 * Cenários de rede reproduzíveis. Escolha um de três jeitos:
 *   1. URL:      http://localhost:5173/?scenario=slow
 *   2. Console:  window.__mock.setScenario('offline')
 *   3. Playwright: page.evaluate(() => window.__mock?.setScenario('server-error'))
 * A escolha fica salva no localStorage até você trocar (use "default" para voltar).
 */
export const SCENARIOS = [
  'default', // resposta normal, ~200 ms
  'empty', // listagem sem resultados
  'slow', // 2,5 s de latência fixa (para ver skeletons)
  'variable-latency', // latência alternada 1,8 s / 0,1 s / 0,9 s / 0,05 s (respostas fora de ordem)
  'timeout', // a resposta nunca chega (o Axios estoura em 10 s)
  'offline', // falha de conexão (sem resposta)
  'server-error', // HTTP 500 sempre
  'flaky', // 1ª tentativa de cada requisição falha com 503; a repetição funciona
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

/**
 * Todo handler chama isto primeiro. Se devolver uma Response, o handler
 * deve retorná-la (é a falha simulada); se devolver undefined, segue o fluxo normal.
 */
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
