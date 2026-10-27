import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import type { UserFixture } from "../fixtures/users";

function toPublicUser(user: UserFixture) {
  return { id: user.id, name: user.name, email: user.email };
}

function createSession(userId: string) {
  const db = getDb();
  const token = crypto.randomUUID();
  db.sessions[token] = userId;
  persistDb();
  return token;
}

export const authHandlers = [
  http.post(apiPath("/auth/login"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { email?: string; password?: string };
    const db = getDb();
    const user = db.users.find((item) => item.email === body.email);
    if (!user || user.password !== body.password) {
      return errorResponse(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    }

    return HttpResponse.json({ user: toPublicUser(user), token: createSession(user.id) });
  }),

  http.post(apiPath("/auth/register"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const db = getDb();

    if (!body.name || !body.email || !body.password) {
      return errorResponse(400, "VALIDATION_ERROR", "Preencha todos os campos.");
    }
    if (db.users.some((item) => item.email === body.email)) {
      return errorResponse(400, "VALIDATION_ERROR", "Não foi possível criar a conta.", {
        email: ["E-mail já cadastrado."],
      });
    }

    const user: UserFixture = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      password: body.password,
      username: body.email.split("@")[0],
      ensName: body.email.split("@")[0],
      walletNickname: "",
    };
    db.users.push(user);
    persistDb();

    return HttpResponse.json({ user: toPublicUser(user), token: createSession(user.id) });
  }),

  http.post(apiPath("/auth/logout"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (token) {
      delete getDb().sessions[token];
      persistDb();
    }
    return HttpResponse.json({ ok: true });
  }),

  http.get(apiPath("/auth/me"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const user = getDb().users.find((item) => item.id === resolveUserId(request));
    if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sessão inválida ou expirada.");
    return HttpResponse.json(toPublicUser(user));
  }),
];
