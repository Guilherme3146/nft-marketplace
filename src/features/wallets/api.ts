import { api } from "@/lib/api";
import type { SaveWalletInput, Wallet } from "./types";

export async function fetchPrimaryWallet(signal?: AbortSignal) {
  const { data } = await api.get<Wallet | null>("/wallets/primary", { signal });
  return data;
}

export async function savePrimaryWallet(input: SaveWalletInput, signal?: AbortSignal) {
  const { data } = await api.put<Wallet>("/wallets/primary", input, { signal });
  return data;
}
