import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "./queries";

/**
 * Usado no "beforeLoad" de rotas protegidas (perfil, carteiras...). Tenta
 * garantir que existe uma sessão válida antes da rota carregar; sem ela,
 * manda a pessoa pro login em vez de deixar a tela renderizar.
 */
export async function requireSession(queryClient: QueryClient) {
  try {
    return await queryClient.ensureQueryData(sessionQueryOptions());
  } catch {
    throw redirect({ to: "/login" });
  }
}
