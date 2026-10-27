import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { queryClient } from '@/lib/query-client'
import { socket } from '@/lib/socket'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({
  routeTree,
  // O que as rotas (loaders, beforeLoad) podem acessar: o cache do TanStack Query.
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

// Registra o router para que Link, useSearch, useParams etc. sejam tipados.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/** A API simulada precisa estar pronta ANTES do primeiro render, senão a 1ª requisição (ou conexão de socket) foge dela. */
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

void enableMocking().then(() => {
  socket.connect()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
