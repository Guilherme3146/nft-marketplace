import type { Eth } from "@/features/nfts/types";

export interface CartLineItem {
  nftId: string;
  editionId: string;
  qty: number;
  nft: { id: string; name: string; collection: string; coverUrl: string };
  edition: { id: string; label: string; priceEth: Eth; available: number };
}

export interface CartResponse {
  items: CartLineItem[];
}
