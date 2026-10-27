import { http, HttpResponse } from 'msw'
import { getDb } from '../db'
import { parseListParams, queryNfts } from '../nft-logic'
import { applyScenario, getScenario } from '../scenarios'
import { apiPath, errorResponse } from '../utils'

export const nftHandlers = [
  http.get(apiPath('/nfts'), async ({ request }) => {
    const failure = await applyScenario(request)
    if (failure) return failure

    const params = parseListParams(new URL(request.url).searchParams)
    const catalog = getScenario() === 'empty' ? [] : getDb().nfts
    return HttpResponse.json(queryNfts(catalog, params))
  }),

  http.get(apiPath('/nfts/:id'), async ({ request, params }) => {
    const failure = await applyScenario(request)
    if (failure) return failure

    const nft = getDb().nfts.find((item) => item.id === String(params.id))
    if (!nft) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(nft)
  }),
]
