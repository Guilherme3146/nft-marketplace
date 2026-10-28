import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario, getScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import { resolveCartItems } from "./cart";
import { computeQuote } from "./quote";
import { broadcastOrderUpdate } from "./realtime";
import type { Order } from "@/features/orders/types";

// Simula o tempo de confirmação on-chain antes do pedido sair de "pending".
// Resolvido de forma preguiçosa (por tempo decorrido), não só por um timer: assim,
// um refresh/reconexão no meio do caminho também resolve o pedido corretamente,
// sem depender de um timer sobrevivendo a um reload da página.
const RESOLUTION_DELAY_MS = 1500;

function resolveIfDue(userId: string, order: Order): Order {
  if (order.status !== "pending") return order;
  const dueAt = new Date(order.createdAt).getTime() + RESOLUTION_DELAY_MS;
  if (Date.now() < dueAt) return order;

  order.status = getScenario() === "payment-declined" ? "declined" : "confirmed";
  if (order.status === "confirmed") {
    // Só remove do carrinho o que foi efetivamente comprado, e só quando a compra
    // realmente se confirma — numa recusa, os itens continuam lá pro usuário tentar de novo.
    const db = getDb();
    db.cartByUser[userId] = [];
    delete db.couponByUser[userId];
  }
  persistDb();
  broadcastOrderUpdate({ id: order.id, status: order.status });
  return order;
}

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
      if (sameWallet && sameNote) return HttpResponse.json(resolveIfDue(userId, duplicate));
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
      status: "pending",
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
    persistDb();

    // Resolve no tempo (confirmado/recusado) enquanto a aba continuar aberta; se o
    // usuário recarregar antes disso, resolveIfDue cuida disso na próxima leitura.
    setTimeout(() => resolveIfDue(userId, order), RESOLUTION_DELAY_MS + 50);

    return HttpResponse.json(order);
  }),

  http.get(apiPath("/orders/:id"), async ({ request, params }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const userId = resolveUserId(request);
    const order = (getDb().ordersByUser[userId] ?? []).find((item) => item.id === String(params.id));
    if (!order) return errorResponse(404, "NOT_FOUND", "Pedido não encontrado.");
    return HttpResponse.json(resolveIfDue(userId, order));
  }),
];
