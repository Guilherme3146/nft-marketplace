export const WALLET_NETWORKS = ["ethereum", "polygon", "solana"] as const;
export type WalletNetwork = (typeof WALLET_NETWORKS)[number];

export const WALLET_TYPES = ["metamask", "walletconnect", "coinbase"] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

export interface Wallet {
  id: string;
  displayName: string;
  walletNickname: string;
  network: WalletNetwork;
  profileName: string;
  address: string;
  secondaryAddress?: string;
  walletType: WalletType;
  referralCode: string;
  email: string;
  ensName: string;
}

export type SaveWalletInput = Omit<Wallet, "id">;
