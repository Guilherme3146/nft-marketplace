import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, Download, Heart, LogOut, MapPin, ShoppingBag, TriangleAlert, User } from "lucide-react";
import { useLogout } from "@/features/auth/queries";

interface AccountSidebarProps {
  active: "perfil" | "carteiras";
}

const DISABLED_ITEMS = [
  { label: "Atividade", Icon: ShoppingBag },
  { label: "Lista de interesse", Icon: Heart },
  { label: "Ofertas", Icon: Activity },
  { label: "Arquivos baixados", Icon: Download },
  { label: "Suporte", Icon: TriangleAlert },
];

export function AccountSidebar({ active }: AccountSidebarProps) {
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <aside className="flex w-full flex-col gap-1 bg-card py-2 lg:w-[310px] lg:shrink-0">
      <h2 className="px-4 py-2 text-lg font-bold text-foreground">Meu perfil</h2>

      <Link
        to="/perfil"
        className={`flex items-center gap-4 border-l-[6px] px-4 text-[15px] leading-[45px] text-accent ${
          active === "perfil" ? "border-primary" : "border-transparent"
        }`}
      >
        <User className="size-5" />
        Dados do perfil
      </Link>

      <Link
        to="/carteiras"
        className={`flex items-center gap-4 border-l-[6px] px-4 text-[15px] leading-[45px] text-accent ${
          active === "carteiras" ? "border-primary" : "border-transparent"
        }`}
      >
        <MapPin className="size-5" />
        Carteiras
      </Link>

      {DISABLED_ITEMS.map(({ label, Icon }) => (
        <span
          key={label}
          className="flex cursor-not-allowed items-center gap-4 px-4 text-[15px] leading-[45px] text-muted-foreground"
        >
          <Icon className="size-5" />
          {label}
        </span>
      ))}

      <hr className="my-1 border-border" />

      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: "/" }) })}
        className="flex h-10 items-center gap-2 px-4 text-[15px] font-bold text-accent disabled:opacity-60"
      >
        <LogOut className="size-5" />
        Sair
      </button>
    </aside>
  );
}
