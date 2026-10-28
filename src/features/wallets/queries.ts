import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import {
  connectWallet,
  deleteSecondaryWallet,
  fetchPrimaryWallet,
  fetchSecondaryWallet,
  savePrimaryWallet,
  saveSecondaryWallet,
} from "./api";
import type { SaveWalletInput } from "./types";

export const walletKeys = {
  primary: ["wallets", "primary"] as const,
  secondary: ["wallets", "secondary"] as const,
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

export function secondaryWalletQueryOptions() {
  return queryOptions({
    queryKey: walletKeys.secondary,
    queryFn: ({ signal }) => fetchSecondaryWallet(signal),
  });
}

export function useSaveSecondaryWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveWalletInput) => saveSecondaryWallet(input),
    onSuccess: (wallet) => {
      queryClient.setQueryData(walletKeys.secondary, wallet);
    },
  });
}

export function useDeleteSecondaryWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteSecondaryWallet(),
    onSuccess: () => {
      queryClient.setQueryData(walletKeys.secondary, null);
    },
  });
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: () => connectWallet(),
    retry: false,
  });
}
