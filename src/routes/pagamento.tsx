import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { clearIdempotencyKey, readOrCreateIdempotencyKey } from "@/features/orders/idempotency";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import Decimal from "decimal.js";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { cartQueryOptions } from "@/features/cart/queries";
import { profileQueryOptions } from "@/features/profile/queries";
import { primaryWalletQueryOptions } from "@/features/wallets/queries";
import { WALLET_TYPES } from "@/features/wallets/types";
import { useCreateOrder } from "@/features/orders/queries";
import { quoteQueryOptions } from "@/features/cotacao/queries";
import { isApiError } from "@/lib/api";

const WALLET_TYPE_LABELS: Record<(typeof WALLET_TYPES)[number], string> = {
  metamask: "MetaMask",
  walletconnect: "WalletConnect",
  coinbase: "Coinbase Wallet",
};

const checkoutSchema = z.object({
  walletType: z.enum(WALLET_TYPES),
  note: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/pagamento")({
  beforeLoad: async ({ context }) => {
    await requireSession(context.queryClient);
  },
  loader: async ({ context }) => {
    const [cart] = await Promise.all([
      context.queryClient.ensureQueryData(cartQueryOptions()),
      context.queryClient.ensureQueryData(profileQueryOptions()),
      context.queryClient.ensureQueryData(primaryWalletQueryOptions()),
      context.queryClient.ensureQueryData(quoteQueryOptions()),
    ]);
    if (cart.items.length === 0) throw redirect({ to: "/carrinho" });
  },
  component: PagamentoPage,
});

function PagamentoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cart } = useSuspenseQuery(cartQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const { data: wallet } = useSuspenseQuery(primaryWalletQueryOptions());
  const { data: quote } = useSuspenseQuery(quoteQueryOptions());
  const createOrder = useCreateOrder();

  const [idempotencyKey] = useState(readOrCreateIdempotencyKey);
  const [needsReconfirm, setNeedsReconfirm] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [revalidationError, setRevalidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { walletType: wallet?.walletType ?? "metamask", note: "" },
  });

  async function onSubmit(values: CheckoutFormValues) {
    // Revalida preço, disponibilidade e cupom direto no servidor antes de confirmar:
    // se algo mudou desde que a tela carregou (ex.: estoque/curtidas em tempo real,
    // cupom expirado), atualiza os valores exibidos e exige um novo clique em vez
    // de confirmar a compra com números que o usuário não viu.
    setRevalidating(true);
    setRevalidationError(null);

    try {
      const before = queryClient.getQueryData(quoteQueryOptions().queryKey);
      const fresh = await queryClient.fetchQuery({ ...quoteQueryOptions(), staleTime: 0 });

      const changed =
        !before || before.totalEth !== fresh.totalEth || before.subtotalEth !== fresh.subtotalEth;
      if (changed) {
        setNeedsReconfirm(true);
        return;
      }
    } catch (error) {
      setRevalidationError(
        isApiError(error) ? error.message : "Não foi possível confirmar a compra.",
      );
      return;
    } finally {
      setRevalidating(false);
    }

    setNeedsReconfirm(false);
    createOrder.mutate(
      { idempotencyKey, walletType: values.walletType, note: values.note },
      {
        onSuccess: (order) => {
          clearIdempotencyKey();
          navigate({ to: "/confirmacao/$orderId", params: { orderId: order.id } });
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) clearIdempotencyKey();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-foreground">
        <Link to="/">Início</Link> / Mercado / Pagamento
      </nav>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="flex w-full flex-1 flex-col gap-6">
          <h1 className="text-base font-bold text-foreground">Perfil do colecionador</h1>

          {wallet ? (
            <dl className="grid grid-cols-1 gap-4 rounded-xl bg-card p-5 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-secondary">Nome de exibição</dt>
                <dd className="text-foreground">{wallet.displayName}</dd>
              </div>
              <div>
                <dt className="text-secondary">Rede</dt>
                <dd className="text-foreground">{wallet.network}</dd>
              </div>
              <div>
                <dt className="text-secondary">Endereço da carteira</dt>
                <dd className="truncate text-foreground">{wallet.address}</dd>
              </div>
              <div>
                <dt className="text-secondary">E-mail</dt>
                <dd className="text-foreground">{profile.email}</dd>
              </div>
            </dl>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl bg-card p-5 text-sm text-muted-foreground">
              <p>Você ainda não cadastrou uma carteira.</p>
              <Link to="/carteiras" className="w-fit text-accent underline">
                Cadastrar carteira
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="note" className="text-[15px] text-foreground">
              Observação do colecionador (opcional)
            </label>
            <textarea
              {...register("note")}
              id="note"
              rows={5}
              className="w-full rounded-[3px] border border-border bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 rounded-xl bg-card p-5 lg:w-[405px] lg:shrink-0">
          <h2 className="text-lg font-bold text-foreground">Seus NFTs</h2>

          <ul className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-3">
                <img
                  src={item.nft.coverUrl}
                  alt={`Arte do NFT ${item.nft.name}`}
                  width={65}
                  height={65}
                  className="size-[65px] shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{item.nft.name}</p>
                  <p className="text-sm text-secondary">
                    ID do token: #{item.nftId} (x {item.qty})
                  </p>
                </div>
                <p className="font-bold text-accent">
                  {new Decimal(item.edition.priceEth).times(item.qty).toFixed()} ETH
                </p>
              </li>
            ))}
          </ul>

          <hr className="border-border" />

          <div className="flex flex-col gap-3 text-[15px] text-foreground">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="text-lg font-bold">{quote.subtotalEth} ETH</span>
            </div>
            {quote.coupon?.valid ? (
              <div className="flex items-center justify-between">
                <span>Desconto ({quote.coupon.code})</span>
                <span className="text-lg font-bold">(-) {quote.discountEth} ETH</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span>Taxa de rede</span>
                <span className="text-lg font-bold">{quote.networkFeeEth} ETH</span>
              </div>
              <span className="text-xs text-accent">Taxa estimada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-lg font-bold text-accent">{quote.totalEth} ETH</span>
            </div>
          </div>

          <hr className="border-border" />

          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-foreground">Carteira e rede</h3>
            {WALLET_TYPES.map((value) => (
              <label
                key={value}
                className="flex h-[45px] items-center gap-3 rounded-[3px] border border-border px-3 text-sm text-foreground has-checked:border-primary"
              >
                <input type="radio" value={value} {...register("walletType")} />
                {WALLET_TYPE_LABELS[value]}
              </label>
            ))}
            {errors.walletType ? (
              <p className="text-xs text-destructive">Selecione uma carteira.</p>
            ) : null}
          </div>

          {needsReconfirm ? (
            <p role="alert" className="text-sm text-accent">
              Os valores mudaram desde que você abriu esta tela. Revise o resumo acima e confirme de
              novo para continuar.
            </p>
          ) : null}

          {revalidationError ? <p className="text-sm text-destructive">{revalidationError}</p> : null}

          {createOrder.isError ? (
            <p className="text-sm text-destructive">
              {isApiError(createOrder.error) ? createOrder.error.message : "Não foi possível confirmar a compra."}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={createOrder.isPending || revalidating || !wallet}
            className="h-[45px] rounded-lg bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
          >
            {createOrder.isPending
              ? "Confirmando..."
              : revalidating
                ? "Verificando valores..."
                : needsReconfirm
                  ? "Confirmar com os novos valores"
                  : "Confirmar compra"}
          </button>
        </div>
      </form>
    </div>
  );
}
