import { api } from "@/lib/api";
import type { Quote } from "./types";

export async function fetchQuote(signal?: AbortSignal) {
  const { data } = await api.get<Quote>("/cotacao", { signal });
  return data;
}

export async function applyCoupon(code: string, signal?: AbortSignal) {
  const { data } = await api.put<Quote>("/cart/coupon", { code }, { signal });
  return data;
}

export async function removeCoupon(signal?: AbortSignal) {
  const { data } = await api.delete<Quote>("/cart/coupon", { signal });
  return data;
}
