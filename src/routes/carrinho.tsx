import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/features/cart/queries";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";

export const Route = createFileRoute("/carrinho")({
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const items = cart.data?.items ?? [];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-foreground">
        <Link to="/">Início</Link> / Mercado / Carrinho
      </nav>

      {cart.isPending ? (
        <p role="status" className="text-muted-foreground">
          Carregando carrinho...
        </p>
      ) : items.length === 0 ? (
        <section className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-bold text-foreground">Seu carrinho está vazio</h1>
          <Link to="/" className="text-accent underline">
            Continuar explorando
          </Link>
        </section>
      ) : (
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full flex-1 flex-col gap-3">
            <div className="hidden grid-cols-[250px_77px_75px_87px_24px] gap-3 px-3 text-sm font-bold text-muted-foreground md:grid">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow key={`${item.nftId}-${item.editionId}`} item={item} />
              ))}
            </ul>
          </div>

          <CartSummary items={items} />
        </div>
      )}
    </div>
  );
}
