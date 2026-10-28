import { api } from "@/lib/api";
import type { ChangePasswordInput, Profile, UpdateProfileInput } from "./types";

export async function fetchProfile(signal?: AbortSignal) {
  const { data } = await api.get<Profile>("/profile", { signal });
  return data;
}

export async function updateProfile(input: UpdateProfileInput, signal?: AbortSignal) {
  const { data } = await api.patch<Profile>("/profile", input, { signal });
  return data;
}

export async function changePassword(input: ChangePasswordInput, signal?: AbortSignal) {
  await api.patch("/profile/password", input, { signal });
}

export async function updateAvatar(avatarUrl: string | null, signal?: AbortSignal) {
  const { data } = await api.patch<Profile>("/profile", { avatarUrl: avatarUrl ?? "" }, { signal });
  return data;
}
