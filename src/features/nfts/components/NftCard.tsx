import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { NftSummary } from "../types";

interface NftCardProps {
  nft: NftSummary;
}

/**
 * Card usado tanto no grid do catálogo quanto na seção de destaques —
 * mesmo componente, dado diferente. Sem favoritar aqui: o README lista
 * "favoritos" como requisito da tela de Detalhes do NFT, não do catálogo,
 * e o Figma também só mostra o coração como um estado ilustrativo
 * pontual, não em todo card.
 */
export function NftCard({ nft }: NftCardProps) {
  return (
    <li>
      <Link to="/nfts/$id" params={{ id: nft.id }} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-card">
          <img
            src={nft.coverUrl}
            alt={`Arte do NFT ${nft.name}`}
            width={400}
            height={400}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
          />

          {nft.available === 0 ? (
            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
              Esgotado
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 truncate font-medium text-foreground">{nft.name}</h3>
        <p className="truncate text-sm text-muted-foreground">{nft.collection}</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">{nft.priceEth} ETH</p>
          {/* Fora do Figma: evidência visual do tempo real (Socket.IO) atualizando o card sozinho. */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3" />
            {nft.likes}
          </span>
        </div>
      </Link>
    </li>
  );
}
