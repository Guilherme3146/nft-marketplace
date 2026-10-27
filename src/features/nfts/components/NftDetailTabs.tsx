import { useState } from "react";
import { Star } from "lucide-react";
import type { Nft } from "../types";
import { getReviewCount, getReviews } from "../review-data";

interface NftDetailTabsProps {
  nft: Nft;
  editionLabel: string;
}

export function NftDetailTabs({ nft, editionLabel }: NftDetailTabsProps) {
  const [tab, setTab] = useState<"detalhes" | "avaliacoes">("detalhes");
  const reviewCount = getReviewCount(nft.id);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex gap-8 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("detalhes")}
          className={
            tab === "detalhes"
              ? "border-b-2 border-accent pb-3 text-[15px] font-bold text-accent"
              : "border-b-2 border-transparent pb-3 text-[15px] font-bold text-muted-foreground"
          }
        >
          Detalhes do NFT
        </button>
        <button
          type="button"
          onClick={() => setTab("avaliacoes")}
          className={
            tab === "avaliacoes"
              ? "border-b-2 border-accent pb-3 text-[15px] font-bold text-accent"
              : "border-b-2 border-transparent pb-3 text-[15px] font-bold text-muted-foreground"
          }
        >
          Avaliações de colecionadores ({reviewCount})
        </button>
      </div>

      {tab === "detalhes" ? (
        <div className="flex flex-col gap-6 text-sm leading-6 text-muted-foreground">
          <p>
            {nft.name} é uma obra digital {editionLabel} da coleção {nft.collection}. Cada
            atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra
            explora identidade, movimento e luz em um mundo digital sem fronteiras.
          </p>
          <p>
            A propriedade inclui a arte em alta resolução, lançamentos exclusivos para
            colecionadores e um registro permanente de procedência registrada na rede.{" "}
            {nft.creatorName} recebe 5% de direitos autorais nas vendas secundárias, apoiando
            novos trabalhos e lançamentos da comunidade.
          </p>
          <div>
            <p className="font-bold text-foreground">Rede:</p>
            <p>Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.</p>
          </div>
          <div>
            <p className="font-bold text-foreground">Contrato:</p>
            <p>
              Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente
              pelos mercados compatíveis.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground">Direitos autorais:</p>
            <p>0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {getReviews(nft.id).map((review) => (
            <li key={review.author} className="flex flex-col gap-1 rounded-lg bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground">{review.author}</p>
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: review.stars }, (_, i) => (
                    <Star key={i} className="size-4" fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
