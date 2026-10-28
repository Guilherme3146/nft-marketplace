import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { nftKeys } from "./queries";
import type { Nft, NftListResponse, NftSummary } from "./types";

interface NftRealtimeUpdate {
  id: string;
  likes: number;
  available: number;
  priceEth: string;
  version: number;
}

function reconcileNft<T extends NftSummary>(item: T, update: NftRealtimeUpdate): T {
  if (item.id !== update.id) return item;
  if (update.version <= item.version) return item;
  return {
    ...item,
    likes: update.likes,
    available: update.available,
    priceEth: update.priceEth,
    version: update.version,
  };
}

export function useRealtimeNftUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let activeSocket: Awaited<ReturnType<typeof getSocket>> | undefined;

    function handleUpdate(update: NftRealtimeUpdate) {
      queryClient.setQueriesData({ queryKey: nftKeys.all }, (data: unknown) => {
        if (!data) return data;

        if (typeof data === "object" && data !== null && "items" in data) {
          const list = data as NftListResponse;
          return { ...list, items: list.items.map((item) => reconcileNft(item, update)) };
        }

        return reconcileNft(data as Nft, update);
      });
    }

    void getSocket().then((socket) => {
      if (cancelled) return;
      activeSocket = socket;
      socket.on("nft.updated", handleUpdate);
    });

    return () => {
      cancelled = true;
      activeSocket?.off("nft.updated", handleUpdate);
    };
  }, [queryClient]);
}
