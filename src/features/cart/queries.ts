import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { addToCart, fetchCart, updateCartItemQty } from "./api";
import type { CartResponse } from "./types";

export const cartKeys = {
  all: ["cart"] as const,
};

export function cartQueryOptions() {
  return queryOptions({
    queryKey: cartKeys.all,
    queryFn: ({ signal }) => fetchCart(signal),
  });
}

export function useCart() {
  return useQuery(cartQueryOptions());
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { nftId: string; editionId: string; qty: number }) => addToCart(params),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.all, data);
    },
  });
}

/**
 * Atualização otimista: a quantidade muda na hora do clique, antes da API
 * responder; qty 0 remove a linha. Mesmo padrão de snapshot+rollback dos
 * favoritos (onMutate guarda o estado anterior, onError devolve ele).
 */
export function useUpdateCartItemQty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { nftId: string; editionId: string; qty: number }) =>
      updateCartItemQty(params),

    onMutate: async ({ nftId, editionId, qty }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all });
      const previous = queryClient.getQueryData<CartResponse>(cartKeys.all);

      queryClient.setQueryData<CartResponse>(cartKeys.all, (current) => ({
        items: (current?.items ?? [])
          .map((item) =>
            item.nftId === nftId && item.editionId === editionId ? { ...item, qty } : item,
          )
          .filter((item) => item.qty > 0),
      }));

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.all, context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
