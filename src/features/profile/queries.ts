import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { changePassword, fetchProfile, updateProfile } from "./api";
import type { ChangePasswordInput, UpdateProfileInput } from "./types";
import { sessionKeys } from "@/features/auth/queries";

export const profileKeys = {
  all: ["profile"] as const,
};

export function profileQueryOptions() {
  return queryOptions({
    queryKey: profileKeys.all,
    queryFn: ({ signal }) => fetchProfile(signal),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.all, profile);
      // O header mostra "Olá, <nome>" a partir da sessão — mantém os dois em sincronia.
      queryClient.setQueryData(sessionKeys.all, {
        id: profile.id,
        name: profile.name,
        email: profile.email,
      });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
}
