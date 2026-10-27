import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { useRegister } from "@/features/auth/queries";
import { isApiError } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome."),
    email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    password: z.string().min(6, "Mínimo de 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: RegisterFormValues) {
    registerUser.mutate(values, { onSuccess: () => navigate({ to: "/" }) });
  }

  return (
    <AuthCard
      active="cadastro"
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <input
            {...register("name")}
            type="text"
            placeholder="Nome de usuário"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register("email")}
            type="email"
            placeholder="Digite seu e-mail"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register("password")}
            type="password"
            placeholder="Senha"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Confirmar senha"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {registerUser.isError ? (
          <p className="text-sm text-destructive">
            {isApiError(registerUser.error)
              ? registerUser.error.message
              : "Não foi possível criar a conta."}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={registerUser.isPending}
          className="mt-2 h-[45px] rounded-[5px] bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
        >
          {registerUser.isPending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </AuthCard>
  );
}
