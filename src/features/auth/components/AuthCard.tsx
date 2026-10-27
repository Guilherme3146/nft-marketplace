import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AuthCardProps {
  active: "login" | "cadastro";
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ active, subtitle, children }: AuthCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col overflow-hidden rounded-lg bg-card">
      <div className="flex flex-col gap-6 px-6 pt-12 sm:px-20">
        <div className="flex items-center gap-4 text-xl font-medium">
          <Link
            to="/login"
            className={active === "login" ? "text-accent" : "text-foreground"}
          >
            Entrar
          </Link>
          <span className="text-text-coral">|</span>
          <Link
            to="/cadastro"
            className={active === "cadastro" ? "text-accent" : "text-foreground"}
          >
            Criar conta
          </Link>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 px-6 pt-6 sm:px-20">{children}</div>

      <div className="flex flex-col gap-3 px-6 pb-8 pt-6 sm:px-20">
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <hr className="flex-1 border-border" />
          Ou continue com
          <hr className="flex-1 border-border" />
        </div>
        <button
          type="button"
          disabled
          className="h-10 cursor-not-allowed rounded-[5px] border border-border text-[13px] font-medium text-muted-foreground opacity-60"
        >
          Continuar com Google
        </button>
        <button
          type="button"
          disabled
          className="h-10 cursor-not-allowed rounded-[5px] border border-border text-[13px] font-medium text-muted-foreground opacity-60"
        >
          Continuar com Facebook
        </button>
      </div>

      <div className="h-[10px] w-full bg-primary" />
    </div>
  );
}
