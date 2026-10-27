/** ETH sempre trafega como string decimal ("0.25"). Nunca use number para dinheiro. */
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

/** Versão resumida: é o que a listagem (cards) recebe. */
export interface NftSummary {
  id: string
  name: string
  collection: string
  creatorName: string
  category: NftCategory
  coverUrl: string
  /** Menor preço entre as edições. */
  priceEth: Eth
  /** Soma das unidades disponíveis de todas as edições. */
  available: number
  likes: number
  /** Cresce a cada alteração; é como o cliente descarta eventos antigos (Socket.IO). */
  version: number
}

/** Versão completa: é o que a tela de detalhe recebe. */
export interface Nft extends NftSummary {
  description: string
  images: string[]
  editions: NftEdition[]
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
