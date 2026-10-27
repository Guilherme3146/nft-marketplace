import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { LogIn, LogOut, Search, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/features/cart/queries'
import { useLogout, useSession } from '@/features/auth/queries'
import { useRealtimeNftUpdates } from '@/features/nfts/realtime'
import { Footer } from '@/components/Footer'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  useRealtimeNftUpdates()

  const cart = useCart()
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0

  const session = useSession()
  const logout = useLogout()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="shrink-0 text-lg font-bold tracking-wide text-foreground">
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-10 text-[15px] font-medium md:flex">
            <Link to="/" className="text-foreground" activeProps={{ className: 'text-accent' }}>
              Início
            </Link>
            <Link to="/" className="text-foreground" activeProps={{ className: 'text-accent' }}>
              Mercado
            </Link>
            <span className="cursor-not-allowed text-muted-foreground">Criadores</span>
            <span className="cursor-not-allowed text-muted-foreground">Aprenda</span>
          </nav>

          <div className="flex items-center gap-4 sm:gap-7">
            <Search aria-hidden="true" className="hidden size-5 text-muted-foreground md:block" />

            <Link to="/carrinho" aria-label="Carrinho" className="relative text-foreground">
              <ShoppingCart className="size-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {session.data ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/perfil"
                  className="flex items-center gap-1 text-sm text-foreground hover:text-accent"
                >
                  <User className="size-5 sm:hidden" aria-hidden="true" />
                  <span className="hidden sm:inline">Olá, {session.data.name}</span>
                  <span className="sr-only sm:hidden">Meu perfil</span>
                </Link>
                <button
                  type="button"
                  aria-label="Sair"
                  title="Sair"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  <LogOut className="size-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="Entrar"
                className="flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-medium text-accent sm:px-4"
              >
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
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
