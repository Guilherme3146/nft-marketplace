import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { requireSession } from "@/features/auth/require-session";
import { orderQueryOptions } from "@/features/orders/queries";
import { isApiError } from "@/lib/api";

const WALLET_TYPE_LABELS = {
  metamask: "MetaMask",
  walletconnect: "WalletConnect",
  coinbase: "Coinbase Wallet",
};

export const Route = createFileRoute("/confirmacao/$orderId")({
  beforeLoad: async ({ context }) => {
    await requireSession(context.queryClient);
  },
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(orderQueryOptions(params.orderId));
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw notFound();
      throw error;
    }
  },
  notFoundComponent: () => (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold text-foreground">Pedido não encontrado</h1>
      <Link to="/" className="text-accent underline">
        Voltar ao início
      </Link>
    </section>
  ),
  component: ConfirmacaoPage,
});

function ConfirmacaoPage() {
  const { orderId } = Route.useParams();
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId));

  const formattedDate = new Date(order.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-[578px] flex-col overflow-hidden rounded-lg bg-card">
      <div className="flex flex-col items-center gap-4 px-6 pt-12 text-center sm:px-12">
        <div className="flex size-20 items-center justify-center rounded-full bg-surface-raised text-3xl">
          🎉
        </div>
        <h1 className="text-xl font-bold text-foreground">Seus NFTs agora estão na sua carteira</h1>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-y-3 divide-border border-y border-border px-4 py-4 text-center text-sm sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:px-8">
        <div>
          <p className="text-muted-foreground">ID da transação</p>
          <p className="truncate font-medium text-foreground">{order.id.slice(0, 8)}…</p>
        </div>
        <div>
          <p className="text-muted-foreground">Data</p>
          <p className="font-medium text-foreground">{formattedDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-medium text-foreground">{order.totalEth} ETH</p>
        </div>
        <div>
          <p className="text-muted-foreground">Carteira</p>
          <p className="font-medium text-foreground">{WALLET_TYPE_LABELS[order.walletType]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-6 sm:px-8">
        <h2 className="text-[15px] font-bold text-foreground">Detalhes da transação</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
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
                <p className="text-sm text-muted-foreground">
                  ID do token: #{item.nftId} (x {item.qty})
                </p>
              </div>
              <p className="font-bold text-accent">
                {item.edition.priceEth} ETH
              </p>
            </li>
          ))}
        </ul>

        <hr className="border-border" />

        <div className="flex items-center justify-between text-[15px] text-foreground">
          <span>Taxa de rede</span>
          <span className="font-bold">{order.networkFeeEth} ETH</span>
        </div>
        <div className="flex items-center justify-between text-[15px] text-foreground">
          <span className="font-bold">Total</span>
          <span className="text-lg font-bold text-accent">{order.totalEth} ETH</span>
        </div>

        {order.note ? (
          <p className="mt-2 text-sm text-muted-foreground">"{order.note}"</p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-4 px-4 pb-8 sm:px-8">
        <p className="text-center text-sm text-muted-foreground">
          Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>
        <button
          type="button"
          disabled
          className="h-10 cursor-not-allowed rounded-[5px] border border-border px-4 text-sm font-medium text-muted-foreground opacity-60"
        >
          Ver no Etherscan
        </button>
        <Link to="/" className="text-sm text-accent underline">
          Voltar ao catálogo
        </Link>
      </div>

      <div className="h-[10px] w-full bg-primary" />
    </div>
  );
}
