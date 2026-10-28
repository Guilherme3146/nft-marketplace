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

export async function fetchSecondaryWallet(signal?: AbortSignal) {
  const { data } = await api.get<Wallet | null>("/wallets/secondary", { signal });
  return data;
}

export async function saveSecondaryWallet(input: SaveWalletInput, signal?: AbortSignal) {
  const { data } = await api.put<Wallet>("/wallets/secondary", input, { signal });
  return data;
}

export async function deleteSecondaryWallet(signal?: AbortSignal) {
  await api.delete("/wallets/secondary", { signal });
}

export async function connectWallet(signal?: AbortSignal) {
  await api.post("/wallets/connect", {}, { signal });
}
