export interface CouponDefinition {
  code: string
  kind: 'percent' | 'fixed'
  value: number
  expired?: boolean
  minSubtotalEth?: string
}

export const COUPONS: CouponDefinition[] = [
  { code: 'LANCA10', kind: 'percent', value: 10 },
  { code: 'BEMVINDO', kind: 'fixed', value: 0.01 },
  { code: 'KURIO50', kind: 'percent', value: 50, minSubtotalEth: '1' },
  { code: 'EXPIRADO10', kind: 'percent', value: 10, expired: true },
]
