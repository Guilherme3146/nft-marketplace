import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { createOrder, fetchOrder } from "./api";
import { cartKeys } from "@/features/cart/queries";
import type { CreateOrderInput } from "./types";

export const orderKeys = {
  detail: (id: string) => ["orders", id] as const,
};

export function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => fetchOrder(id, signal),
  });
}

/**
 * SEM otimismo de propósito: diferente de favoritos/carrinho, aqui a tela só
 * avança pra confirmação depois que o servidor realmente respondeu que o
 * pedido foi criado — nunca antes.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      // A compra esvaziou o carrinho no servidor; o cache local precisa saber disso.
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
