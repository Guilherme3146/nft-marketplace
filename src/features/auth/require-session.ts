import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "./queries";

export async function requireSession(queryClient: QueryClient) {
  try {
    return await queryClient.ensureQueryData(sessionQueryOptions());
  } catch {
    throw redirect({ to: "/login" });
  }
}
