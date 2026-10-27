import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { fetchPrimaryWallet, savePrimaryWallet } from "./api";
import type { SaveWalletInput } from "./types";

export const walletKeys = {
  primary: ["wallets", "primary"] as const,
};

export function primaryWalletQueryOptions() {
  return queryOptions({
    queryKey: walletKeys.primary,
    queryFn: ({ signal }) => fetchPrimaryWallet(signal),
  });
}

export function useSavePrimaryWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveWalletInput) => savePrimaryWallet(input),
    onSuccess: (wallet) => {
      queryClient.setQueryData(walletKeys.primary, wallet);
    },
  });
}
