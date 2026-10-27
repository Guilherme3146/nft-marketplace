export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  ensName: string;
  walletNickname: string;
}

export type UpdateProfileInput = Omit<Profile, "id">;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
