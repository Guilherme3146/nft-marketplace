import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { AccountFormField, EnsField, accountInputClass } from "@/features/account/components/AccountFormField";
import {
  profileQueryOptions,
  useChangePassword,
  useUpdateAvatar,
  useUpdateProfile,
} from "@/features/profile/queries";
import { isApiError } from "@/lib/api";

const MAX_AVATAR_BYTES = 300 * 1024;

const profileSchema = z
  .object({
    displayName: z.string().min(1, "Informe seu nome de exibição."),
    username: z.string().min(1, "Informe um nome de usuário."),
    email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    ensName: z.string().min(1, "Informe o nome ENS."),
    walletNickname: z.string().min(1, "Informe um apelido para a carteira."),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      const wantsChange = data.currentPassword || data.newPassword || data.confirmNewPassword;
      if (!wantsChange) return true;
      return (
        !!data.currentPassword &&
        !!data.newPassword &&
        data.newPassword.length >= 6 &&
        data.newPassword === data.confirmNewPassword
      );
    },
    {
      message: "Pra alterar a senha, preencha a atual e a nova (mínimo 6 caracteres) iguais na confirmação.",
      path: ["newPassword"],
    },
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export const Route = createFileRoute("/perfil")({
  beforeLoad: async ({ context }) => {
    await requireSession(context.queryClient);
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(profileQueryOptions());
  },
  component: PerfilPage,
});

function PerfilPage() {
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateAvatar = useUpdateAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  function handleAvatarFile(file: File | undefined) {
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Envie um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("A imagem precisa ter no máximo 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateAvatar.mutate(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.name,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      walletNickname: profile.walletNickname,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate({
      name: values.displayName,
      username: values.username,
      email: values.email,
      ensName: values.ensName,
      walletNickname: values.walletNickname,
    });

    if (values.newPassword && values.currentPassword) {
      changePassword.mutate(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        {
          onSuccess: () => {
            setValue("currentPassword", "");
            setValue("newPassword", "");
            setValue("confirmNewPassword", "");
          },
        },
      );
    }
  }

  const isSaving = updateProfile.isPending || changePassword.isPending;

  return (
    <div className="flex flex-col items-start gap-7 lg:flex-row">
      <AccountSidebar active="perfil" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full flex-1 flex-col gap-8">
        <h1 className="text-base font-bold text-foreground">Perfil do colecionador</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AccountFormField label="Nome de exibição" error={errors.displayName?.message}>
            <input {...register("displayName")} className={accountInputClass} />
          </AccountFormField>
          <AccountFormField label="Nome de usuário" error={errors.username?.message}>
            <input {...register("username")} className={accountInputClass} />
          </AccountFormField>
          <AccountFormField label="E-mail" error={errors.email?.message}>
            <input {...register("email")} type="email" className={accountInputClass} />
          </AccountFormField>
          <AccountFormField label="Nome ENS" error={errors.ensName?.message}>
            <EnsField register={register("ensName")} />
          </AccountFormField>
          <AccountFormField label="Apelido da carteira" error={errors.walletNickname?.message}>
            <input {...register("walletNickname")} className={accountInputClass} />
          </AccountFormField>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar do colecionador"
                width={50}
                height={50}
                className="size-[50px] rounded-full object-cover"
              />
            ) : (
              <div className="flex size-[50px] items-center justify-center rounded-full border border-border bg-surface-raised">
                <User className="size-6 text-muted-foreground" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAvatarFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={updateAvatar.isPending}
              className="h-10 w-[98px] rounded-[3px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {updateAvatar.isPending ? "..." : "Alterar"}
            </button>
            {profile.avatarUrl ? (
              <button
                type="button"
                onClick={() => updateAvatar.mutate(null)}
                disabled={updateAvatar.isPending}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                Remover
              </button>
            ) : (
              <span className="cursor-not-allowed text-sm text-muted-foreground opacity-60">Remover</span>
            )}
          </div>
          {avatarError ? <p className="text-xs text-destructive">{avatarError}</p> : null}
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-base font-medium text-foreground">Alterar senha</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AccountFormField label="Senha atual" required={false} error={errors.currentPassword?.message}>
              <input {...register("currentPassword")} type="password" className={accountInputClass} />
            </AccountFormField>
            <AccountFormField label="Nova senha" required={false} error={errors.newPassword?.message}>
              <input {...register("newPassword")} type="password" className={accountInputClass} />
            </AccountFormField>
            <AccountFormField
              label="Confirmar nova senha"
              required={false}
              error={errors.confirmNewPassword?.message}
            >
              <input {...register("confirmNewPassword")} type="password" className={accountInputClass} />
            </AccountFormField>
          </div>
        </div>

        {updateProfile.isError || changePassword.isError ? (
          <p className="text-sm text-destructive">
            {isApiError(updateProfile.error)
              ? updateProfile.error.message
              : isApiError(changePassword.error)
                ? changePassword.error.message
                : "Não foi possível salvar."}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="h-10 w-[131px] rounded-[3px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
