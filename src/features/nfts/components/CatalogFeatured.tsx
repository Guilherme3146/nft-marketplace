import { useQuery } from "@tanstack/react-query";
import { nftListQueryOptions } from "../queries";

/**
 * Painel de destaque da barra lateral (bate com o Figma "Featured NFT
 * Banner"): mostra o NFT mais popular do catálogo. É uma query própria e
 * independente dos filtros que o usuário está usando no grid principal —
 * senão o destaque "somaria" ao filtro errado.
 */
export function CatalogFeatured() {
  const query = useQuery(
    nftListQueryOptions({ sort: "popular", page: 1, pageSize: 1 }),
  );
  const nft = query.data?.items[0];

  return (
    <div className="flex w-[310px] shrink-0 flex-col items-center gap-4 rounded-xl bg-gradient-to-b from-primary/10 to-primary/[0.03] px-5 pt-6 pb-1">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-2xl font-bold text-accent">NFT EM DESTAQUE</p>
        <p className="text-xl font-bold text-foreground">OFERTA LIMITADA</p>
      </div>

      {nft ? (
        <img
          src={nft.coverUrl}
          alt={`Arte do NFT ${nft.name}`}
          width={310}
          height={368}
          loading="lazy"
          className="h-[368px] w-full rounded-[22px] object-cover"
        />
      ) : (
        <div
          role="status"
          aria-label="Carregando destaque"
          className="h-[368px] w-full animate-pulse rounded-[22px] bg-card"
        />
      )}
    </div>
  );
}
