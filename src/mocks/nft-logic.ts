import Decimal from 'decimal.js'
import type {
  FacetCount,
  Nft,
  NftCategory,
  NftListParams,
  NftListResponse,
  NftSort,
  NftSummary,
} from '@/features/nfts/types'
import { NFT_CATEGORIES, NFT_SORTS } from '@/features/nfts/types'

export function recomputeDerived(nft: Nft): void {
  nft.priceEth = Decimal.min(...nft.editions.map((edition) => edition.priceEth)).toFixed()
  nft.available = nft.editions.reduce((sum, edition) => sum + edition.available, 0)
}

export function toSummary(nft: Nft): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    collection: nft.collection,
    creatorName: nft.creatorName,
    category: nft.category,
    coverUrl: nft.coverUrl,
    priceEth: nft.priceEth,
    available: nft.available,
    likes: nft.likes,
    version: nft.version,
  }
}

type ParsedListParams = NftListParams & {
  sort: NftSort
  page: number
  pageSize: number
}

const isCategory = (value: string): value is NftCategory =>
  (NFT_CATEGORIES as readonly string[]).includes(value)
const isSort = (value: string | null): value is NftSort =>
  value !== null && (NFT_SORTS as readonly string[]).includes(value)

function parseDecimal(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    const parsed = new Decimal(value)
    return parsed.isFinite() && parsed.gte(0) ? parsed.toFixed() : undefined
  } catch {
    return undefined
  }
}

function parseInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export function parseListParams(searchParams: URLSearchParams): ParsedListParams {
  const categories = searchParams.getAll('category').filter(isCategory)
  const collections = searchParams.getAll('collection')
  const sort = searchParams.get('sort')
  return {
    q: searchParams.get('q')?.trim() || undefined,
    category: categories.length > 0 ? categories : undefined,
    collection: collections.length > 0 ? collections : undefined,
    minPrice: parseDecimal(searchParams.get('minPrice')),
    maxPrice: parseDecimal(searchParams.get('maxPrice')),
    availableOnly: searchParams.get('availableOnly') === 'true',
    sort: isSort(sort) ? sort : 'recent',
    page: parseInteger(searchParams.get('page'), 1, 1, 10_000),
    pageSize: parseInteger(searchParams.get('pageSize'), 12, 1, 48),
  }
}

function countBy(values: string[]): FacetCount[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

const comparators: Record<NftSort, (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  popular: (a, b) => b.likes - a.likes,
  'price-asc': (a, b) => new Decimal(a.priceEth).cmp(b.priceEth),
  'price-desc': (a, b) => new Decimal(b.priceEth).cmp(a.priceEth),
}

export function queryNfts(all: Nft[], params: ParsedListParams): NftListResponse {
  const term = params.q?.toLowerCase()
  const filtered = all.filter((nft) => {
    if (term && !`${nft.name} ${nft.collection} ${nft.creatorName}`.toLowerCase().includes(term)) return false
    if (params.category && !params.category.includes(nft.category)) return false
    if (params.collection && !params.collection.includes(nft.collection)) return false
    if (params.minPrice && new Decimal(nft.priceEth).lt(params.minPrice)) return false
    if (params.maxPrice && new Decimal(nft.priceEth).gt(params.maxPrice)) return false
    if (params.availableOnly && nft.available === 0) return false
    return true
  })

  const compare = comparators[params.sort]
  const sorted = [...filtered].sort((a, b) => compare(a, b) || a.id.localeCompare(b.id))

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize))
  const start = (params.page - 1) * params.pageSize

  return {
    items: sorted.slice(start, start + params.pageSize).map(toSummary),
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages,
    facets: {
      categories: countBy(all.map((nft) => nft.category)),
      collections: countBy(all.map((nft) => nft.collection)),
    },
  }
}
