import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchNft, fetchNfts } from './api'
import type { NftListParams } from './types'

/**
 * Query keys: a chave INCLUI os parâmetros. Parâmetros diferentes = cache diferente,
 * e é isso que impede "resposta antiga sobrescrever resposta nova".
 */
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
    // `signal` permite cancelar a requisição quando a consulta deixa de ser usada.
    queryFn: ({ signal }) => fetchNfts(params, signal),
    // Mantém a página anterior na tela enquanto a próxima carrega (sem "piscar").
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
  })
}
