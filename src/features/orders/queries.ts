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
