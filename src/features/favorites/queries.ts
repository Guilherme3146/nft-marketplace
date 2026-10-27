import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { addFavorite, fetchFavorites, removeFavorite } from "./api";
import type { FavoritesResponse } from "./types";

export const favoriteKeys = {
  all: ["favorites"] as const,
};

export function favoritesQueryOptions() {
  return queryOptions({
    queryKey: favoriteKeys.all,
    queryFn: ({ signal }) => fetchFavorites(signal),
  });
}

export function useFavorites() {
  return useQuery(favoritesQueryOptions());
}

/**
 * Atualização otimista: o coração muda na hora do clique, antes da resposta
 * da API chegar. Se a chamada falhar, onError devolve o snapshot exato de
 * antes (não um valor chutado). onSettled sempre revalida com o servidor
 * no final, sucesso ou erro.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nftId, isFavorite }: { nftId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavorite(nftId) : addFavorite(nftId),

    onMutate: async ({ nftId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });
      const previous = queryClient.getQueryData<FavoritesResponse>(favoriteKeys.all);

      queryClient.setQueryData<FavoritesResponse>(favoriteKeys.all, (current) => {
        const nftIds = current?.nftIds ?? [];
        return {
          nftIds: isFavorite
            ? nftIds.filter((id) => id !== nftId)
            : [...nftIds, nftId],
        };
      });

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoriteKeys.all, context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
