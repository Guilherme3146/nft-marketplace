import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requireSession } from "@/features/auth/require-session";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { AccountFormField, EnsField, accountInputClass } from "@/features/account/components/AccountFormField";
import { primaryWalletQueryOptions, useSavePrimaryWallet } from "@/features/wallets/queries";
import { WALLET_NETWORKS, WALLET_TYPES } from "@/features/wallets/types";
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

const walletSchema = z.object({
  displayName: z.string().min(1, "Informe o nome de exibição."),
  walletNickname: z.string().min(1, "Informe um apelido para a carteira."),
  network: z.enum(WALLET_NETWORKS),
  profileName: z.string().min(1, "Informe o nome do perfil."),
  address: z.string().regex(ADDRESS_PATTERN, "Use um endereço no formato 0x... (40 caracteres hex)."),
  secondaryAddress: z.string().optional(),
  walletType: z.enum(WALLET_TYPES),
  referralCode: z.string().min(1, "Informe o código de indicação."),
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  ensName: z.string().min(1, "Informe o nome ENS."),
});

type WalletFormValues = z.infer<typeof walletSchema>;

export const Route = createFileRoute("/carteiras")({
  beforeLoad: async ({ context }) => {
    await requireSession(context.queryClient);
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(primaryWalletQueryOptions());
  },
  component: CarteirasPage,
});

function CarteirasPage() {
  const { data: wallet } = useSuspenseQuery(primaryWalletQueryOptions());
  const saveWallet = useSavePrimaryWallet();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: wallet ?? {
      displayName: "",
      walletNickname: "",
      network: "ethereum",
      profileName: "",
      address: "",
      secondaryAddress: "",
      walletType: "metamask",
      referralCode: "",
      email: "",
      ensName: "",
    },
  });

  function onSubmit(values: WalletFormValues) {
    saveWallet.mutate(values);
  }

  return (
    <div className="flex flex-col items-start gap-7 lg:flex-row">
      <AccountSidebar active="carteiras" />

      <div className="flex w-full flex-1 flex-col gap-8">
        <div>
          <h1 className="text-[17px] font-bold text-foreground">Carteira principal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AccountFormField label="Nome de exibição" error={errors.displayName?.message}>
              <input {...register("displayName")} className={accountInputClass} />
            </AccountFormField>
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
            <AccountFormField label="Nome do perfil" error={errors.profileName?.message}>
              <input {...register("profileName")} className={accountInputClass} />
            </AccountFormField>

            <AccountFormField label="Endereço da carteira" error={errors.address?.message}>
              <input
                {...register("address")}
                placeholder="Endereço 0x da carteira"
                className={accountInputClass}
              />
            </AccountFormField>
            <AccountFormField label="ENS ou carteira secundária" required={false}>
              <input
                {...register("secondaryAddress")}
                placeholder="(opcional)"
                className={accountInputClass}
              />
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
            <AccountFormField label="Código de indicação" error={errors.referralCode?.message}>
              <input {...register("referralCode")} className={accountInputClass} />
            </AccountFormField>

            <AccountFormField label="E-mail" error={errors.email?.message}>
              <input {...register("email")} type="email" className={accountInputClass} />
            </AccountFormField>
            <AccountFormField label="Nome ENS" error={errors.ensName?.message}>
              <EnsField register={register("ensName")} />
            </AccountFormField>
          </div>

          {saveWallet.isError ? (
            <p className="text-sm text-destructive">
              {isApiError(saveWallet.error) ? saveWallet.error.message : "Não foi possível salvar a carteira."}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saveWallet.isPending}
            className="h-10 w-[131px] rounded-[3px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saveWallet.isPending ? "Salvando..." : "Salvar carteira"}
          </button>
        </form>

        {/* Gerenciar múltiplas carteiras é fora do escopo deste desafio — só a carteira principal é funcional (ver ARCHITECTURE.md). */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-[17px] font-bold text-foreground">Carteira secundária</h2>
          <p className="text-sm text-muted-foreground">
            Você ainda não adicionou uma carteira secundária.
          </p>
          <span className="w-fit cursor-not-allowed text-sm font-medium text-accent opacity-60">
            Adicionar
          </span>
        </div>
      </div>
    </div>
  );
}
