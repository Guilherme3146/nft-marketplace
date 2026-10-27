import { api } from "@/lib/api";
import type { FavoritesResponse } from "./types";

export async function fetchFavorites(signal?: AbortSignal) {
  const { data } = await api.get<FavoritesResponse>("/favorites", { signal });
  return data;
}

export async function addFavorite(nftId: string, signal?: AbortSignal) {
  const { data } = await api.post<FavoritesResponse>(
    "/favorites",
    { nftId },
    { signal },
  );
  return data;
}

export async function removeFavorite(nftId: string, signal?: AbortSignal) {
  const { data } = await api.delete<FavoritesResponse>(
    `/favorites/${encodeURIComponent(nftId)}`,
    { signal },
  );
  return data;
}
