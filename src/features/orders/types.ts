import type { Eth } from "@/features/nfts/types";
import type { WalletType } from "@/features/wallets/types";

export interface OrderItem {
  nftId: string;
  editionId: string;
  qty: number;
  nft: { id: string; name: string; collection: string; coverUrl: string };
  edition: { id: string; label: string; priceEth: Eth };
}

export type OrderStatus = "pending" | "confirmed" | "declined";

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalEth: Eth;
  discountEth: Eth;
  couponCode?: string;
  networkFeeEth: Eth;
  totalEth: Eth;
  walletType: WalletType;
  note?: string;
  createdAt: string;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  walletType: WalletType;
  note?: string;
}
