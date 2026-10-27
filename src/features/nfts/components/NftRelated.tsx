import { useQuery } from "@tanstack/react-query";
import { nftListQueryOptions } from "../queries";
import { NftCard } from "./NftCard";

interface NftRelatedProps {
  collection: string;
  excludeId: string;
}

export function NftRelated({ collection, excludeId }: NftRelatedProps) {
  const query = useQuery(
    nftListQueryOptions({ collection: [collection], page: 1, pageSize: 6 }),
  );

  const related = (query.data?.items ?? [])
    .filter((item) => item.id !== excludeId)
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-3">
      <h2 id="related-title" className="text-lg font-bold text-foreground">
        Mais desta coleção
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {related.map((nft) => (
          <NftCard key={nft.id} nft={nft} />
        ))}
      </ul>
    </section>
  );
}
