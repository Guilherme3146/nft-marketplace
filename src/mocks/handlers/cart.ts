import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";

export function resolveCartItems(userId: string) {
  const db = getDb();
  const records = db.cartByUser[userId] ?? [];
  return records.flatMap((record) => {
    const nft = db.nfts.find((item) => item.id === record.nftId);
    const edition = nft?.editions.find((item) => item.id === record.editionId);
    if (!nft || !edition) return [];
    return [
      {
        nftId: nft.id,
        editionId: edition.id,
        qty: record.qty,
        nft: { id: nft.id, name: nft.name, collection: nft.collection, coverUrl: nft.coverUrl },
        edition: { id: edition.id, label: edition.label, priceEth: edition.priceEth, available: edition.available },
      },
    ];
  });
}

export const cartHandlers = [
  http.get(apiPath("/cart"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    return HttpResponse.json({ items: resolveCartItems(resolveUserId(request)) });
  }),

  http.post(apiPath("/cart"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { nftId?: string; editionId?: string; qty?: number };
    const db = getDb();
    const nft = db.nfts.find((item) => item.id === body.nftId);
    const edition = nft?.editions.find((item) => item.id === body.editionId);
    if (!nft || !edition) {
      return errorResponse(404, "NOT_FOUND", "NFT ou edição não encontrados.");
    }
    if (edition.available <= 0) {
      return errorResponse(400, "OUT_OF_STOCK", "Esta edição está esgotada.");
    }

    const userId = resolveUserId(request);
    const cart = db.cartByUser[userId] ?? (db.cartByUser[userId] = []);
    const qty = Math.max(1, Math.trunc(body.qty ?? 1));
    const existing = cart.find((item) => item.nftId === nft.id && item.editionId === edition.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, edition.available);
    } else {
      cart.push({ nftId: nft.id, editionId: edition.id, qty: Math.min(qty, edition.available) });
    }
    persistDb();
    return HttpResponse.json({ items: resolveCartItems(userId) });
  }),

  http.patch(apiPath("/cart/:nftId/:editionId"), async ({ request, params }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { qty?: number };
    const db = getDb();
    const userId = resolveUserId(request);
    const cart = db.cartByUser[userId] ?? [];
    const nftId = String(params.nftId);
    const editionId = String(params.editionId);

    if (!body.qty || body.qty <= 0) {
      db.cartByUser[userId] = cart.filter((item) => !(item.nftId === nftId && item.editionId === editionId));
    } else {
      const item = cart.find((entry) => entry.nftId === nftId && entry.editionId === editionId);
      const edition = db.nfts.find((nft) => nft.id === nftId)?.editions.find((e) => e.id === editionId);
      if (item && edition) {
        item.qty = Math.min(Math.trunc(body.qty), edition.available);
      }
    }
    persistDb();
    return HttpResponse.json({ items: resolveCartItems(userId) });
  }),
];
