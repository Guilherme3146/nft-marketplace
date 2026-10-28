import { http, HttpResponse } from "msw";
import Decimal from "decimal.js";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import { resolveCartItems } from "./cart";
import { COUPONS } from "../fixtures/coupons";
import { NETWORK_FEE_ETH } from "@/features/cart/constants";
import type { CouponResult, Quote } from "@/features/cotacao/types";

export function computeQuote(userId: string, couponCodeOverride?: string | null): Quote {
  const items = resolveCartItems(userId);
  const subtotal = items.reduce(
    (sum, item) => sum.plus(new Decimal(item.edition.priceEth).times(item.qty)),
    new Decimal(0),
  );

  const appliedCode =
    couponCodeOverride !== undefined ? couponCodeOverride : getDb().couponByUser[userId];

  let discount = new Decimal(0);
  let coupon: CouponResult | null = null;

  if (appliedCode) {
    const normalized = appliedCode.trim().toUpperCase();
    const definition = COUPONS.find((item) => item.code === normalized);
    if (!definition) {
      coupon = { code: normalized, valid: false, reason: "Código promocional inválido." };
    } else if (definition.expired) {
      coupon = { code: normalized, valid: false, reason: "Código promocional expirado." };
    } else if (definition.minSubtotalEth && subtotal.lessThan(definition.minSubtotalEth)) {
      coupon = {
        code: normalized,
        valid: false,
        reason: `Válido a partir de ${definition.minSubtotalEth} ETH em NFTs no carrinho.`,
      };
    } else {
      discount =
        definition.kind === "percent"
          ? subtotal.times(definition.value).dividedBy(100)
          : new Decimal(definition.value);
      if (discount.greaterThan(subtotal)) discount = subtotal;
      coupon = { code: normalized, valid: true };
    }
  }

  const total = subtotal.minus(discount).plus(NETWORK_FEE_ETH);

  return {
    subtotalEth: subtotal.toFixed(),
    discountEth: discount.toFixed(),
    networkFeeEth: NETWORK_FEE_ETH,
    totalEth: total.toFixed(),
    coupon,
  };
}

export const quoteHandlers = [
  http.get(apiPath("/cotacao"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    return HttpResponse.json(computeQuote(resolveUserId(request)));
  }),

  http.put(apiPath("/cart/coupon"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { code?: string };
    if (!body.code?.trim()) {
      return errorResponse(400, "VALIDATION_ERROR", "Informe um código promocional.");
    }

    const userId = resolveUserId(request);
    const quote = computeQuote(userId, body.code);
    if (!quote.coupon?.valid) {
      return errorResponse(400, "INVALID_COUPON", quote.coupon?.reason ?? "Código promocional inválido.");
    }

    getDb().couponByUser[userId] = quote.coupon.code;
    persistDb();
    return HttpResponse.json(quote);
  }),

  http.delete(apiPath("/cart/coupon"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const userId = resolveUserId(request);
    delete getDb().couponByUser[userId];
    persistDb();
    return HttpResponse.json(computeQuote(userId, null));
  }),
];
