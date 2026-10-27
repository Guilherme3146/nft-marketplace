import { api } from "@/lib/api";
import type { CartResponse } from "./types";

export async function fetchCart(signal?: AbortSignal) {
  const { data } = await api.get<CartResponse>("/cart", { signal });
  return data;
}

export async function addToCart(
  params: { nftId: string; editionId: string; qty: number },
  signal?: AbortSignal,
) {
  const { data } = await api.post<CartResponse>("/cart", params, { signal });
  return data;
}

export async function updateCartItemQty(
  params: { nftId: string; editionId: string; qty: number },
  signal?: AbortSignal,
) {
  const { data } = await api.patch<CartResponse>(
    `/cart/${encodeURIComponent(params.nftId)}/${encodeURIComponent(params.editionId)}`,
    { qty: params.qty },
    { signal },
  );
  return data;
}
