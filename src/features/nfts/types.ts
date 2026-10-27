export type Eth = string

export const NFT_CATEGORIES = ['art', 'music', 'photography', 'gaming', 'collectibles'] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

export const NFT_SORTS = ['recent', 'popular', 'price-asc', 'price-desc'] as const
export type NftSort = (typeof NFT_SORTS)[number]

export interface NftEdition {
  id: string
  label: string
  priceEth: Eth
  available: number
  total: number
}

export interface NftSummary {
  id: string
  name: string
  collection: string
  creatorName: string
  category: NftCategory
  coverUrl: string
  priceEth: Eth
  available: number
  likes: number
  version: number
}

export interface Nft extends NftSummary {
  description: string
  images: string[]
  editions: NftEdition[]
  attributes: string[]
  createdAt: string
}

export interface NftListParams {
  q?: string
  category?: NftCategory[]
  collection?: string[]
  minPrice?: Eth
  maxPrice?: Eth
  availableOnly?: boolean
  sort?: NftSort
  page?: number
  pageSize?: number
}

export interface FacetCount {
  value: string
  count: number
}

export interface NftListResponse {
  items: NftSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: { categories: FacetCount[]; collections: FacetCount[] }
}
