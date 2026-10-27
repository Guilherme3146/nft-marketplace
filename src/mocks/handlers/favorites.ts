import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse } from "../utils";

export const favoritesHandlers = [
  // GET /api/favorites
  http.get(apiPath("/favorites"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    return HttpResponse.json({ nftIds: getDb().favorites });
  }),

  // POST /api/favorites  { nftId }
  http.post(apiPath("/favorites"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { nftId?: string };
    if (!body.nftId || !getDb().nfts.some((nft) => nft.id === body.nftId)) {
      return errorResponse(404, "NOT_FOUND", "NFT não encontrado.");
    }

    const db = getDb();
    if (!db.favorites.includes(body.nftId)) {
      db.favorites.push(body.nftId);
      persistDb();
    }
    return HttpResponse.json({ nftIds: db.favorites });
  }),

  // DELETE /api/favorites/:nftId
  http.delete(apiPath("/favorites/:nftId"), async ({ request, params }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const db = getDb();
    db.favorites = db.favorites.filter((id) => id !== String(params.nftId));
    persistDb();
    return HttpResponse.json({ nftIds: db.favorites });
  }),
];
