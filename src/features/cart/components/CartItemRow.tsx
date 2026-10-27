import { Link } from "@tanstack/react-router";
import Decimal from "decimal.js";
import { Trash2 } from "lucide-react";
import { NftQuantityStepper } from "@/features/nfts/components/NftQuantityStepper";
import { useUpdateCartItemQty } from "../queries";
import type { CartLineItem } from "../types";

interface CartItemRowProps {
  item: CartLineItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQty = useUpdateCartItemQty();
  const totalEth = new Decimal(item.edition.priceEth).times(item.qty).toFixed();

  return (
    // Abaixo de md: cartão empilhado (imagem+nome em cima, resto numa linha).
    // A partir de md: "md:contents" devolve a linha ao grid de 5 colunas do <li> pai,
    // igual ao desenho original de tabela — mesmas classes, dois layouts.
    <li className="flex flex-col gap-3 rounded-md bg-card p-3 md:grid md:h-[70px] md:grid-cols-[250px_77px_75px_87px_24px] md:items-center md:gap-3 md:p-0 md:pr-6">
      <Link to="/nfts/$id" params={{ id: item.nftId }} className="flex items-center gap-3 overflow-hidden">
        <img
          src={item.nft.coverUrl}
          alt={`Arte do NFT ${item.nft.name}`}
          width={70}
          height={70}
          className="size-[70px] shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">{item.nft.name}</p>
          <p className="truncate text-sm text-secondary">
            ID do token: #{item.nftId} · {item.edition.label}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 md:contents">
        <p className="font-bold text-secondary">{item.edition.priceEth} ETH</p>

        <NftQuantityStepper
          quantity={item.qty}
          max={item.edition.available}
          onChange={(qty) =>
            updateQty.mutate({ nftId: item.nftId, editionId: item.editionId, qty })
          }
        />

        <p className="font-bold text-accent">{totalEth} ETH</p>

        <button
          type="button"
          aria-label={`Remover ${item.nft.name} do carrinho`}
          onClick={() =>
            updateQty.mutate({ nftId: item.nftId, editionId: item.editionId, qty: 0 })
          }
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-6" />
        </button>
      </div>
    </li>
  );
}
