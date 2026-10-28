import { useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { changePassword, fetchProfile, updateAvatar, updateProfile } from "./api";
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

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string | null) => updateAvatar(avatarUrl),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.all, profile);
    },
  });
}
