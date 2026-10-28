import { http, HttpResponse } from "msw";
import Decimal from "decimal.js";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import { resolveCartItems } from "./cart";
import { NETWORK_FEE_ETH } from "@/features/cart/constants";
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

    const subtotal = items.reduce(
      (sum, item) => sum.plus(new Decimal(item.edition.priceEth).times(item.qty)),
      new Decimal(0),
    );
    const total = subtotal.plus(NETWORK_FEE_ETH);

    const order: Order = {
      id: body.idempotencyKey,
      items: items.map(({ nftId, editionId, qty, nft, edition }) => ({
        nftId,
        editionId,
        qty,
        nft,
        edition: { id: edition.id, label: edition.label, priceEth: edition.priceEth },
      })),
      subtotalEth: subtotal.toFixed(),
      networkFeeEth: NETWORK_FEE_ETH,
      totalEth: total.toFixed(),
      walletType: body.walletType,
      note: body.note || undefined,
      createdAt: new Date().toISOString(),
    };

    db.ordersByUser[userId] = [...existingOrders, order];
    db.cartByUser[userId] = [];
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
