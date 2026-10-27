import { setupWorker } from 'msw/browser'
import { resetDb } from './db'
import { handlers } from './handlers'
import { getScenario, isScenario, SCENARIOS, setScenario } from './scenarios'
import type { ScenarioName } from './scenarios'

export const worker = setupWorker(...handlers)

declare global {
  interface Window {
    __mock?: {
      reset: () => void
      getScenario: () => ScenarioName
      setScenario: (name: ScenarioName) => void
      scenarios: readonly ScenarioName[]
    }
  }
}

export async function startMocking(): Promise<void> {
  const url = new URL(window.location.href)

  if (url.searchParams.has('mock-reset')) resetDb()
  const requested = url.searchParams.get('scenario')
  if (isScenario(requested)) setScenario(requested)

  window.__mock = { reset: resetDb, getScenario, setScenario, scenarios: SCENARIOS }

  await worker.start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
}
