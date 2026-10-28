import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useApplyCoupon, useQuote, useRemoveCoupon } from "@/features/cotacao/queries";
import { isWalletConnected } from "@/features/wallets/connection";
import { WalletConnectModal } from "@/features/wallets/components/WalletConnectModal";
import { isApiError } from "@/lib/api";

export function CartSummary() {
  const navigate = useNavigate();
  const { data: quote } = useQuote();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const [code, setCode] = useState("");
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  function handleConnectAndFinish() {
    if (isWalletConnected()) {
      navigate({ to: "/pagamento" });
      return;
    }
    setConnectModalOpen(true);
  }

  function handleApply() {
    if (!code.trim()) return;
    applyCoupon.mutate(code.trim(), { onSuccess: () => setCode("") });
  }

  const hasValidCoupon = quote?.coupon?.valid;
  const couponError = applyCoupon.isError
    ? isApiError(applyCoupon.error)
      ? applyCoupon.error.message
      : "Não foi possível aplicar o cupom."
    : null;

  return (
    <aside className="flex w-full flex-col gap-6 rounded-xl bg-card p-5 lg:w-[332px] lg:shrink-0">
      <h2 className="text-lg font-bold text-foreground">Resumo da carteira</h2>

      {hasValidCoupon ? (
        <div className="flex h-10 items-center justify-between rounded-sm border border-primary px-3 text-sm text-foreground">
          <span>
            Cupom <strong>{quote.coupon?.code}</strong> aplicado
          </span>
          <button
            type="button"
            onClick={() => removeCoupon.mutate()}
            disabled={removeCoupon.isPending}
            className="font-bold text-accent disabled:opacity-60"
          >
            Remover
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex h-10 overflow-hidden rounded-sm border border-primary">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o código promocional..."
              aria-label="Código promocional"
              className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={applyCoupon.isPending || !code.trim()}
              className="w-[102px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {applyCoupon.isPending ? "..." : "Aplicar"}
            </button>
          </div>
          {couponError ? <p className="text-xs text-destructive">{couponError}</p> : null}
        </div>
      )}

      <div className="flex flex-col gap-3 text-[15px] text-foreground">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-lg font-bold">{quote?.subtotalEth ?? "0"} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Desconto do cupom</span>
          <span className="text-lg font-bold">(-) {quote?.discountEth ?? "0"} ETH</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Taxa de rede</span>
            <span className="text-lg font-bold">{quote?.networkFeeEth ?? "0"} ETH</span>
          </div>
          <span className="text-xs text-accent">Taxa estimada</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="text-lg font-bold text-accent">{quote?.totalEth ?? "0"} ETH</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={handleConnectAndFinish}
          className="flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground"
        >
          Conectar e finalizar
        </button>
        <Link to="/" className="text-sm text-accent">
          Continuar explorando
        </Link>
      </div>

      <WalletConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        onConnected={() => {
          setConnectModalOpen(false);
          navigate({ to: "/pagamento" });
        }}
      />
    </aside>
  );
}
