import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            NFT Marketplace
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      {/* Só existe em desenvolvimento: mostra o cache do TanStack Query em tempo real. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}

function NotFound() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-neutral-600">O endereço que você abriu não existe.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Voltar ao início
      </Link>
    </section>
  )
}
