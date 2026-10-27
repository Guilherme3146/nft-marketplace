import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { useCart } from '@/features/cart/queries'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const cart = useCart()
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-wide text-foreground">
            KURIO
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-10 text-[15px] font-medium">
            <Link to="/" className="text-foreground" activeProps={{ className: 'text-accent' }}>
              Início
            </Link>
            <Link to="/" className="text-foreground" activeProps={{ className: 'text-accent' }}>
              Mercado
            </Link>
            {/* "Criadores" e "Aprenda" não têm tela correspondente no escopo deste desafio (ver ARCHITECTURE.md). */}
            <span className="cursor-not-allowed text-muted-foreground">Criadores</span>
            <span className="cursor-not-allowed text-muted-foreground">Aprenda</span>
          </nav>

          <div className="flex items-center gap-7">
            <Search aria-hidden="true" className="size-5 text-muted-foreground" />

            <Link to="/carrinho" aria-label="Carrinho" className="relative text-foreground">
              <ShoppingCart className="size-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              disabled
              title="Login chega no próximo módulo"
              className="flex cursor-not-allowed items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-accent opacity-60"
            >
              <LogIn className="size-4" />
              Entrar
            </button>
          </div>
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
      <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">O endereço que você abriu não existe.</p>
      <Link to="/" className="mt-4 inline-block text-accent underline">
        Voltar ao início
      </Link>
    </section>
  )
}
