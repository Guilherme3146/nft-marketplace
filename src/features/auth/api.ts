import { api } from "@/lib/api";
import type { AuthResponse, LoginInput, RegisterInput, User } from "./types";

export async function login(input: LoginInput, signal?: AbortSignal) {
  const { data } = await api.post<AuthResponse>("/auth/login", input, { signal });
  return data;
}

export async function register(input: RegisterInput, signal?: AbortSignal) {
  const { data } = await api.post<AuthResponse>("/auth/register", input, { signal });
  return data;
}

export async function logout(signal?: AbortSignal) {
  await api.post("/auth/logout", {}, { signal });
}

export async function fetchMe(signal?: AbortSignal) {
  const { data } = await api.get<User>("/auth/me", { signal });
  return data;
}
