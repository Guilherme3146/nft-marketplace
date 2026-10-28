import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { createOrder, fetchOrder } from "./api";
import { cartKeys } from "@/features/cart/queries";
import type { CreateOrderInput, Order } from "./types";

export const orderKeys = {
  detail: (id: string) => ["orders", id] as const,
};

export function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => fetchOrder(id, signal),
    // Enquanto o pedido está "pending", reconsulta a API a cada 1s — cobre tanto
    // quem perdeu o evento de socket quanto quem recarregou a página no meio do
    // caminho (a reconciliação acontece via REST, não só via tempo real).
    refetchInterval: (query) => ((query.state.data as Order | undefined)?.status === "pending" ? 1000 : false),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
