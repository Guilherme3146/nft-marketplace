import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import type { Wallet } from "@/features/wallets/types";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export const walletsHandlers = [
  // GET /api/wallets/primary
  http.get(apiPath("/wallets/primary"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    return HttpResponse.json(getDb().walletsByUser[resolveUserId(request)] ?? null);
  }),

  // PUT /api/wallets/primary
  http.put(apiPath("/wallets/primary"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as Omit<Wallet, "id">;
    if (!body.address || !ADDRESS_PATTERN.test(body.address)) {
      return errorResponse(400, "VALIDATION_ERROR", "Endereço de carteira inválido.", {
        address: ["Use um endereço no formato 0x... (40 caracteres hexadecimais)."],
      });
    }

    const userId = resolveUserId(request);
    const db = getDb();
    const existing = db.walletsByUser[userId];
    const wallet: Wallet = { ...body, id: existing?.id ?? crypto.randomUUID() };
    db.walletsByUser[userId] = wallet;
    persistDb();

    return HttpResponse.json(wallet);
  }),
];
