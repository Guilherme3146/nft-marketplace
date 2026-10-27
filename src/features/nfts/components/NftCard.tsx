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
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <img
          src={nft.coverUrl}
          alt={`Arte do NFT ${nft.name}`}
          width={400}
          height={400}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />

        {nft.available === 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
            Esgotado
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 truncate font-medium text-foreground">{nft.name}</h3>
      <p className="truncate text-sm text-muted-foreground">{nft.collection}</p>
      <p className="mt-1 text-sm font-medium text-primary">
        {nft.priceEth} ETH
      </p>
    </li>
  );
}
