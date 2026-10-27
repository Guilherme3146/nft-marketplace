import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Placeholder — o recurso de carrinho de verdade é o próximo módulo.
 * Esta rota existe só pra "Comprar" ter pra onde navegar e tipar certo.
 */
const searchSchema = z.object({
  nftId: z.string().optional(),
  editionId: z.string().optional(),
  qty: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/carrinho")({
  validateSearch: searchSchema,
  component: CartPlaceholder,
});

function CartPlaceholder() {
  const { nftId, editionId, qty } = Route.useSearch();

  return (
    <section>
      <h1 className="text-2xl font-bold text-foreground">Carrinho (em construção)</h1>
      <p className="mt-2 text-muted-foreground">
        Recebido: NFT {nftId}, edição {editionId}, quantidade {qty}.
      </p>
    </section>
  );
}
