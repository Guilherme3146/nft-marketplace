import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import { resolveCartItems } from "./cart";
import { computeQuote } from "./quote";
import type { Order } from "@/features/orders/types";

export const ordersHandlers = [
  http.post(apiPath("/orders"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as {
      idempotencyKey?: string;
      walletType?: Order["walletType"];
      note?: string;
    };
    if (!body.idempotencyKey || !body.walletType) {
      return errorResponse(400, "VALIDATION_ERROR", "Requisição de pedido inválida.");
    }

    const userId = resolveUserId(request);
    const db = getDb();
    const existingOrders = db.ordersByUser[userId] ?? [];

    const duplicate = existingOrders.find((order) => order.id === body.idempotencyKey);
    if (duplicate) {
      const sameWallet = duplicate.walletType === body.walletType;
      const sameNote = (duplicate.note ?? "") === (body.note ?? "");
      if (sameWallet && sameNote) return HttpResponse.json(duplicate);
      return errorResponse(
        409,
        "IDEMPOTENCY_CONFLICT",
        "Esta tentativa de compra já foi usada para um pedido com dados diferentes. Recarregue e confirme novamente.",
      );
    }

    const items = resolveCartItems(userId);
    if (items.length === 0) {
      return errorResponse(400, "EMPTY_CART", "Seu carrinho está vazio.");
    }

    // Nunca confia no total que o cliente mostrou: recalcula no servidor,
    // incluindo o cupom aplicado (também guardado no servidor, não no corpo da requisição).
    const quote = computeQuote(userId);

    const order: Order = {
      id: body.idempotencyKey,
      items: items.map(({ nftId, editionId, qty, nft, edition }) => ({
        nftId,
        editionId,
        qty,
        nft,
        edition: { id: edition.id, label: edition.label, priceEth: edition.priceEth },
      })),
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      couponCode: quote.coupon?.valid ? quote.coupon.code : undefined,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      walletType: body.walletType,
      note: body.note || undefined,
      createdAt: new Date().toISOString(),
    };

    db.ordersByUser[userId] = [...existingOrders, order];
    db.cartByUser[userId] = [];
    delete db.couponByUser[userId];
    persistDb();

    return HttpResponse.json(order);
  }),

  http.get(apiPath("/orders/:id"), async ({ request, params }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const userId = resolveUserId(request);
    const order = (getDb().ordersByUser[userId] ?? []).find((item) => item.id === String(params.id));
    if (!order) return errorResponse(404, "NOT_FOUND", "Pedido não encontrado.");
    return HttpResponse.json(order);
  }),
];
