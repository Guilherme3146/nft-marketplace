import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { applyCoupon, fetchQuote, removeCoupon } from "./api";
import { cartKeys } from "@/features/cart/queries";

export const quoteKeys = {
  all: ["cotacao"] as const,
};

export function quoteQueryOptions() {
  return queryOptions({
    queryKey: quoteKeys.all,
    queryFn: ({ signal }) => fetchQuote(signal),
  });
}

export function useQuote() {
  return useQuery(quoteQueryOptions());
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => applyCoupon(code),
    onSuccess: (quote) => {
      queryClient.setQueryData(quoteKeys.all, quote);
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeCoupon(),
    onSuccess: (quote) => {
      queryClient.setQueryData(quoteKeys.all, quote);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
