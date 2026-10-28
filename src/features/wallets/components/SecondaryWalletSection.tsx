import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AccountFormField, accountInputClass } from "@/features/account/components/AccountFormField";
import {
  secondaryWalletQueryOptions,
  useDeleteSecondaryWallet,
  useSaveSecondaryWallet,
} from "../queries";
import { WALLET_NETWORKS, WALLET_TYPES } from "../types";
import { isApiError } from "@/lib/api";

const NETWORK_LABELS: Record<(typeof WALLET_NETWORKS)[number], string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  solana: "Solana",
};

const WALLET_TYPE_LABELS: Record<(typeof WALLET_TYPES)[number], string> = {
  metamask: "MetaMask",
  walletconnect: "WalletConnect",
  coinbase: "Coinbase",
};

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const secondaryWalletSchema = z.object({
  walletNickname: z.string().min(1, "Informe um apelido para a carteira."),
  network: z.enum(WALLET_NETWORKS),
  address: z.string().regex(ADDRESS_PATTERN, "Use um endereço no formato 0x... (40 caracteres hex)."),
  walletType: z.enum(WALLET_TYPES),
});

type SecondaryWalletValues = z.infer<typeof secondaryWalletSchema>;

export function SecondaryWalletSection() {
  const { data: wallet } = useSuspenseQuery(secondaryWalletQueryOptions());
  const saveWallet = useSaveSecondaryWallet();
  const deleteWallet = useDeleteSecondaryWallet();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecondaryWalletValues>({
    resolver: zodResolver(secondaryWalletSchema),
    defaultValues: {
      walletNickname: wallet?.walletNickname ?? "",
      network: wallet?.network ?? "ethereum",
      address: wallet?.address ?? "",
      walletType: wallet?.walletType ?? "metamask",
    },
  });

  function startEditing() {
    reset({
      walletNickname: wallet?.walletNickname ?? "",
      network: wallet?.network ?? "ethereum",
      address: wallet?.address ?? "",
      walletType: wallet?.walletType ?? "metamask",
    });
    setIsEditing(true);
  }

  function onSubmit(values: SecondaryWalletValues) {
    saveWallet.mutate(
      {
        ...values,
        displayName: values.walletNickname,
        profileName: values.walletNickname,
        referralCode: "",
        email: "",
        ensName: "",
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-[17px] font-bold text-foreground">Carteira secundária</h2>

      {!isEditing ? (
        wallet ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-foreground">
              <span className="font-bold">{wallet.walletNickname}</span> · {NETWORK_LABELS[wallet.network]} ·{" "}
              {WALLET_TYPE_LABELS[wallet.walletType]}
            </p>
            <p className="truncate text-muted-foreground">{wallet.address}</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={startEditing} className="w-fit font-medium text-accent">
                Editar
              </button>
              <button
                type="button"
                onClick={() => deleteWallet.mutate()}
                disabled={deleteWallet.isPending}
                className="w-fit font-medium text-destructive disabled:opacity-60"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Você ainda não adicionou uma carteira secundária.</p>
            <button type="button" onClick={startEditing} className="w-fit text-sm font-medium text-accent">
              Adicionar
            </button>
          </>
        )
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AccountFormField label="Apelido da carteira" error={errors.walletNickname?.message}>
              <input {...register("walletNickname")} className={accountInputClass} />
            </AccountFormField>
            <AccountFormField label="Rede" error={errors.network?.message}>
              <select {...register("network")} className={accountInputClass}>
                {WALLET_NETWORKS.map((value) => (
                  <option key={value} value={value}>
                    {NETWORK_LABELS[value]}
                  </option>
                ))}
              </select>
            </AccountFormField>
            <AccountFormField label="Endereço da carteira" error={errors.address?.message}>
              <input {...register("address")} placeholder="Endereço 0x da carteira" className={accountInputClass} />
            </AccountFormField>
            <AccountFormField label="Tipo de carteira" error={errors.walletType?.message}>
              <select {...register("walletType")} className={accountInputClass}>
                {WALLET_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {WALLET_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </AccountFormField>
          </div>

          {saveWallet.isError ? (
            <p className="text-sm text-destructive">
              {isApiError(saveWallet.error) ? saveWallet.error.message : "Não foi possível salvar a carteira."}
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saveWallet.isPending}
              className="h-10 w-[131px] rounded-[3px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {saveWallet.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-sm text-muted-foreground">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
