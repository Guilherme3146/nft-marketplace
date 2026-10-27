import { api } from "@/lib/api";
import type { CreateOrderInput, Order } from "./types";

export async function createOrder(input: CreateOrderInput, signal?: AbortSignal) {
  const { data } = await api.post<Order>("/orders", input, { signal });
  return data;
}

export async function fetchOrder(id: string, signal?: AbortSignal) {
  const { data } = await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal });
  return data;
}
