import type { Eth } from "@/features/nfts/types";
import type { WalletType } from "@/features/wallets/types";

export interface OrderItem {
  nftId: string;
  editionId: string;
  qty: number;
  nft: { id: string; name: string; collection: string; coverUrl: string };
  edition: { id: string; label: string; priceEth: Eth };
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotalEth: Eth;
  networkFeeEth: Eth;
  totalEth: Eth;
  walletType: WalletType;
  note?: string;
  createdAt: string;
}

export interface CreateOrderInput {
  /** Gerado uma vez no navegador por tentativa de checkout; impede pedido duplicado em reenvio. */
  idempotencyKey: string;
  walletType: WalletType;
  note?: string;
}
