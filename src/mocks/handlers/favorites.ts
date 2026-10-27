import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";

export const favoritesHandlers = [
  http.get(apiPath("/favorites"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const userId = resolveUserId(request);
    return HttpResponse.json({ nftIds: getDb().favoritesByUser[userId] ?? [] });
  }),

  http.post(apiPath("/favorites"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { nftId?: string };
    if (!body.nftId || !getDb().nfts.some((nft) => nft.id === body.nftId)) {
      return errorResponse(404, "NOT_FOUND", "NFT não encontrado.");
    }

    const userId = resolveUserId(request);
    const db = getDb();
    const current = db.favoritesByUser[userId] ?? [];
    if (!current.includes(body.nftId)) {
      db.favoritesByUser[userId] = [...current, body.nftId];
      persistDb();
    }
    return HttpResponse.json({ nftIds: db.favoritesByUser[userId] ?? [] });
  }),

  http.delete(apiPath("/favorites/:nftId"), async ({ request, params }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const userId = resolveUserId(request);
    const db = getDb();
    db.favoritesByUser[userId] = (db.favoritesByUser[userId] ?? []).filter(
      (id) => id !== String(params.nftId),
    );
    persistDb();
    return HttpResponse.json({ nftIds: db.favoritesByUser[userId] ?? [] });
  }),
];
