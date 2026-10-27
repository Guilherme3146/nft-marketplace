import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { useLogin } from "@/features/auth/queries";
import { isApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values, { onSuccess: () => navigate({ to: "/" }) });
  }

  return (
    <AuthCard
      active="login"
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <input
            {...register("email")}
            type="email"
            placeholder="contato@email.com"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register("password")}
            type="password"
            placeholder="***********"
            className="h-10 rounded-[5px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary"
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <span className="self-start text-sm text-accent opacity-60">Esqueceu a senha?</span>

        {login.isError ? (
          <p className="text-sm text-destructive">
            {isApiError(login.error) ? login.error.message : "Não foi possível entrar."}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-2 h-[45px] rounded-[5px] bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
        >
          {login.isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthCard>
  );
}
