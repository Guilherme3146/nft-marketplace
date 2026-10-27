import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import Decimal from "decimal.js";
import { Heart } from "lucide-react";
import { nftDetailQueryOptions } from "@/features/nfts/queries";
import { useFavorites, useToggleFavorite } from "@/features/favorites/queries";
import { useAddToCart } from "@/features/cart/queries";
import { isApiError } from "@/lib/api";
import { CATEGORY_LABELS } from "@/features/nfts/category-labels";
import { NftGallery } from "@/features/nfts/components/NftGallery";
import { NftEditionPicker } from "@/features/nfts/components/NftEditionPicker";
import { NftQuantityStepper } from "@/features/nfts/components/NftQuantityStepper";
import { NftRelated } from "@/features/nfts/components/NftRelated";

export const Route = createFileRoute("/nfts/$id")({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(
        nftDetailQueryOptions(params.id),
      );
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  pendingMs: 0,
  pendingMinMs: 300,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: NftNotFound,
  component: NftDetailPage,
});

function NftDetailPage() {
  const { id } = Route.useParams();
  // useSuspenseQuery: o loader já garantiu o dado no cache, então o tipo
  // de "nft" aqui é sempre definido (nunca undefined) — sem precisar de
  // "if (!nft) return null" nem risco de pular hooks condicionalmente.
  const { data: nft } = useSuspenseQuery(nftDetailQueryOptions(id));

  const [selectedEditionId, setSelectedEditionId] = useState(
    () => nft.editions.find((edition) => edition.available > 0)?.id,
  );
  const selectedEdition = nft.editions.find(
    (edition) => edition.id === selectedEditionId,
  );

  const [quantity, setQuantity] = useState(1);

  function handleSelectEdition(editionId: string) {
    setSelectedEditionId(editionId);
    const edition = nft.editions.find((item) => item.id === editionId);
    setQuantity((current) => Math.min(current, Math.max(1, edition?.available ?? 1)));
  }

  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = favorites.data?.nftIds.includes(nft.id) ?? false;

  const addToCart = useAddToCart();
  const navigate = useNavigate();

  function handleBuy() {
    if (!selectedEdition) return;
    addToCart.mutate(
      { nftId: nft.id, editionId: selectedEdition.id, qty: quantity },
      { onSuccess: () => navigate({ to: "/carrinho" }) },
    );
  }

  const totalPriceEth = selectedEdition
    ? new Decimal(selectedEdition.priceEth).times(quantity).toFixed()
    : undefined;

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-8">
        <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-foreground">
          <Link to="/">Início</Link> / {CATEGORY_LABELS[nft.category]}
        </nav>

        <div className="flex gap-8">
          <NftGallery images={nft.images} productName={nft.name} />

          <div className="flex flex-1 flex-col gap-4">
            <h1 className="text-[28px] font-bold text-foreground">{nft.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-accent">{nft.priceEth} ETH</p>
              {/* Fora do Figma: evidência visual do tempo real (Socket.IO) atualizando sozinho. */}
              <span className="text-sm text-muted-foreground">{nft.likes} curtidas</span>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-bold text-foreground">Sobre este NFT:</p>
              <p className="text-sm leading-6 text-muted-foreground">{nft.description}</p>
            </div>

            <NftEditionPicker
              editions={nft.editions}
              selectedEditionId={selectedEditionId}
              onSelect={handleSelectEdition}
            />

            <NftQuantityStepper
              quantity={quantity}
              max={selectedEdition?.available ?? 0}
              onChange={setQuantity}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBuy}
                disabled={!selectedEdition || addToCart.isPending}
                className="flex h-10 w-[130px] items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                {totalPriceEth ? `COMPRAR` : "ESGOTADO"}
              </button>

              <button
                type="button"
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "Remover dos favoritos" : "Favoritar"}
                disabled={toggleFavorite.isPending}
                onClick={() =>
                  toggleFavorite.mutate({ nftId: nft.id, isFavorite })
                }
                className="flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-primary text-sm font-medium text-accent disabled:opacity-60"
              >
                <Heart className="size-5" fill={isFavorite ? "currentColor" : "none"} />
                Favoritar
              </button>
            </div>

            <dl className="flex flex-col gap-2 text-[15px] text-secondary">
              <div>
                <dt className="inline font-medium">ID do token: </dt>
                <dd className="inline">#{nft.id}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Coleção: </dt>
                <dd className="inline">{nft.collection}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Categoria: </dt>
                <dd className="inline">{CATEGORY_LABELS[nft.category]}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <NftRelated collection={nft.collection} excludeId={nft.id} />
    </div>
  );
}

function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando NFT"
      className="flex gap-8 motion-safe:animate-pulse"
    >
      <div className="size-[444px] rounded-md bg-card" />
      <div className="flex flex-1 flex-col gap-4">
        <div className="h-8 w-2/3 rounded bg-card" />
        <div className="h-6 w-1/4 rounded bg-card" />
        <div className="h-24 w-full rounded bg-card" />
      </div>
    </div>
  );
}

function NftNotFound() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold text-foreground">NFT não encontrado</h1>
      <p className="text-muted-foreground">
        Esse NFT não existe ou foi removido do catálogo.
      </p>
      <Link to="/" className="text-accent underline">
        Voltar ao início
      </Link>
    </section>
  );
}
