import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { NFT_CATEGORIES, NFT_SORTS } from "@/features/nfts/types";
import { nftListQueryOptions } from "@/features/nfts/queries";

import { NftCard } from "@/features/nfts/components/NftCard";

import { CatalogFilters } from "@/features/nfts/components/CatalogFilters";
import { CatalogFeatured } from "@/features/nfts/components/CatalogFeatured";
import { CatalogToolbar } from "@/features/nfts/components/CatalogToolbar";
import { CatalogPagination } from "@/features/nfts/components/CatalogPagination";
import type { NftCategory } from "@/features/nfts/types";

import { useEffect, useState } from "react";

const PAGE_SIZE = 12;

/**
 * O estado da página vive na URL (/?page=2). Assim ele sobrevive a refresh,
 * ao botão "voltar" e pode ser compartilhado. O .catch(1) troca qualquer
 * valor inválido (?page=abc) por 1 em vez de quebrar a tela.
 */
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).catch(1),
  q: z.string().optional().catch(undefined),
  category: z.array(z.enum(NFT_CATEGORIES)).optional().catch(undefined),
  collection: z.array(z.string()).optional().catch(undefined),
  minPrice: z.string().optional().catch(undefined),
  maxPrice: z.string().optional().catch(undefined),
  availableOnly: z.boolean().default(false).catch(false),
  sort: z.enum(NFT_SORTS).default("recent").catch("recent"),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  component: HomePage,
});

function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    page,
    q,
    category,
    collection,
    minPrice,
    maxPrice,
    availableOnly,
    sort,
  } = search;

  const query = useQuery(
    nftListQueryOptions({
      page,
      pageSize: PAGE_SIZE,
      q,
      category,
      collection,
      minPrice,
      maxPrice,
      availableOnly,
      sort,
    }),
  );

  function setFilter(patch: Partial<typeof search>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });
  }

  function toggleCategory(selected: NftCategory) {
    const current = category ?? [];
    const next = current.includes(selected)
      ? current.filter((value) => value !== selected)
      : [...current, selected];
    setFilter({ category: next.length > 0 ? next : undefined });
  }

  const [searchInput, setSearchInput] = useState(q ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilter({ q: searchInput || undefined });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  return (
    <section aria-labelledby="catalog-title">
      <h1 id="catalog-title" className="text-3xl font-bold">
        NFT Marketplace
      </h1>
      <p className="mt-1 text-neutral-600">
        Esta lista vem da API simulada (MSW) via Axios + TanStack Query.
      </p>

      <div className="mt-6">
        <label htmlFor="catalog-search" className="sr-only">
          Buscar NFTs
        </label>
        <input
          id="catalog-search"
          type="search"
          placeholder="Buscar por nome, coleção ou criador..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="mt-8 flex items-start gap-12">
        <div className="flex flex-col gap-6">
          <CatalogFilters
            facets={query.data?.facets}
            selectedCategories={category ?? []}
            onToggleCategory={toggleCategory}
            onApplyPriceRange={(minPrice, maxPrice) =>
              setFilter({ minPrice, maxPrice })
            }
          />
          <CatalogFeatured />
        </div>
        <div className="flex-1">
          <CatalogToolbar sort={sort} onChangeSort={(nextSort) => setFilter({ sort: nextSort })} />

          {query.isPending ? (
            <CatalogSkeleton />
          ) : query.isError ? (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4"
            >
              <p className="font-medium">
                Não foi possível carregar o catálogo.
              </p>
              <p className="text-sm text-neutral-700">{query.error.message}</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-3 rounded bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                Tentar de novo
              </button>
            </div>
          ) : query.data.items.length === 0 ? (
            <p className="mt-6">Nenhum NFT encontrado.</p>
          ) : (
            <>
              <ul
                aria-busy={query.isFetching}
                className={`mt-6 grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${
                  query.isPlaceholderData ? "opacity-60" : ""
                }`}
              >
                {query.data.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </ul>

              <div className="mt-8 flex justify-end">
                <CatalogPagination
                  currentPage={query.data.page}
                  totalPages={query.data.totalPages}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CatalogSkeleton() {
  return (
    <ul
      role="status"
      aria-label="Carregando NFTs"
      className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <li
          key={index}
          className="animate-pulse rounded-lg border border-neutral-200 p-3"
        >
          <div className="aspect-square w-full rounded-md bg-neutral-200" />
          <div className="mt-3 h-4 w-3/4 rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200" />
        </li>
      ))}
    </ul>
  );
}
