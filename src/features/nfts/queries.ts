import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchNft, fetchNfts } from './api'
import type { NftListParams } from './types'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...nftKeys.lists(), params] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (id: string) => [...nftKeys.details(), id] as const,
}

export function nftListQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
  })
}
