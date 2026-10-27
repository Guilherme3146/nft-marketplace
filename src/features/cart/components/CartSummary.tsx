import { Link } from "@tanstack/react-router";
import Decimal from "decimal.js";
import { NETWORK_FEE_ETH } from "../constants";
import type { CartLineItem } from "../types";

interface CartSummaryProps {
  items: CartLineItem[];
}

export function CartSummary({ items }: CartSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum.plus(new Decimal(item.edition.priceEth).times(item.qty)),
    new Decimal(0),
  );
  const total = subtotal.plus(NETWORK_FEE_ETH);

  return (
    <aside className="flex w-[332px] shrink-0 flex-col gap-6 rounded-xl bg-card p-5">
      <h2 className="text-lg font-bold text-foreground">Resumo da carteira</h2>

      <div className="flex h-10 overflow-hidden rounded-sm border border-primary">
        <input
          type="text"
          placeholder="Digite o código promocional..."
          disabled
          className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="button"
          disabled
          className="w-[102px] bg-primary text-sm font-bold text-primary-foreground"
        >
          Aplicar
        </button>
      </div>

      <div className="flex flex-col gap-3 text-[15px] text-foreground">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-lg font-bold">{subtotal.toFixed()} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Desconto do lançamento</span>
          <span className="text-lg font-bold">(-) 00.00</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Taxa de rede</span>
            <span className="text-lg font-bold">{NETWORK_FEE_ETH} ETH</span>
          </div>
          <span className="text-xs text-accent">Taxa estimada</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="text-lg font-bold text-accent">{total.toFixed()} ETH</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3">
        <Link
          to="/pagamento"
          className="flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground"
        >
          Conectar e finalizar
        </Link>
        <Link to="/" className="text-sm text-accent">
          Continuar explorando
        </Link>
      </div>
    </aside>
  );
}
