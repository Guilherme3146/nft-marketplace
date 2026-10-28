import { http, HttpResponse } from "msw";
import { getDb, persistDb } from "../db";
import { applyScenario } from "../scenarios";
import { apiPath, errorResponse, resolveUserId } from "../utils";
import type { UserFixture } from "../fixtures/users";

function toProfile(user: UserFixture) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
  };
}

export const profileHandlers = [
  http.get(apiPath("/profile"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const user = getDb().users.find((item) => item.id === resolveUserId(request));
    if (!user) return errorResponse(401, "UNAUTHENTICATED", "Faça login para ver seu perfil.");
    return HttpResponse.json(toProfile(user));
  }),

  http.patch(apiPath("/profile"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const db = getDb();
    const user = db.users.find((item) => item.id === resolveUserId(request));
    if (!user) return errorResponse(401, "UNAUTHENTICATED", "Faça login para editar seu perfil.");

    const body = (await request.json()) as Partial<
      Pick<UserFixture, "name" | "username" | "email" | "ensName" | "walletNickname" | "avatarUrl">
    >;
    if (body.name) user.name = body.name;
    if (body.username) user.username = body.username;
    if (body.email) user.email = body.email;
    if (body.ensName) user.ensName = body.ensName;
    if (body.walletNickname) user.walletNickname = body.walletNickname;
    if ("avatarUrl" in body) user.avatarUrl = body.avatarUrl || undefined;
    persistDb();

    return HttpResponse.json(toProfile(user));
  }),

  http.patch(apiPath("/profile/password"), async ({ request }) => {
    const failure = await applyScenario(request);
    if (failure) return failure;

    const user = getDb().users.find((item) => item.id === resolveUserId(request));
    if (!user) return errorResponse(401, "UNAUTHENTICATED", "Faça login.");

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    if (user.password !== body.currentPassword) {
      return errorResponse(400, "VALIDATION_ERROR", "Senha atual incorreta.", {
        currentPassword: ["Senha atual incorreta."],
      });
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return errorResponse(400, "VALIDATION_ERROR", "A nova senha precisa ter pelo menos 6 caracteres.");
    }

    user.password = body.newPassword;
    persistDb();
    return HttpResponse.json({ ok: true });
  }),
];
