import type { Eth } from "@/features/nfts/types";

export interface CouponResult {
  code: string;
  valid: boolean;
  reason?: string;
}

export interface Quote {
  subtotalEth: Eth;
  discountEth: Eth;
  networkFeeEth: Eth;
  totalEth: Eth;
  coupon: CouponResult | null;
}
