import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NftSort } from "../types";

const SORT_LABELS: Record<NftSort, string> = {
  recent: "Listados recentemente",
  popular: "Mais populares",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
};

interface CatalogToolbarProps {
  sort: NftSort;
  onChangeSort: (sort: NftSort) => void;
}

/**
 * As abas são atalhos sobre o mesmo parâmetro "sort" — não existe um
 * conceito separado de "novo" no nosso modelo de dado, então "Todos os
 * NFTs" e "Novos lançamentos" fazem a mesma coisa (sort: "recent"); só
 * "Em alta" (sort: "popular") tem um efeito realmente diferente.
 */
export function CatalogToolbar({ sort, onChangeSort }: CatalogToolbarProps) {
  const isPopular = sort === "popular";

  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex gap-5 text-[15px] font-medium">
        <button
          type="button"
          onClick={() => onChangeSort("recent")}
          className={isPopular ? "text-foreground" : "text-accent"}
        >
          Todos os NFTs
        </button>
        <button type="button" onClick={() => onChangeSort("recent")} className="text-foreground">
          Novos lançamentos
        </button>
        <button
          type="button"
          onClick={() => onChangeSort("popular")}
          className={isPopular ? "text-accent" : "text-foreground"}
        >
          Em alta
        </button>
      </div>

      <div className="flex items-center gap-2 text-[15px] text-foreground">
        <span>Ordenar por:</span>
        <Select value={sort} onValueChange={(value) => onChangeSort(value as NftSort)}>
          <SelectTrigger className="border-none bg-transparent px-0 text-foreground shadow-none">
            {/* SelectValue não traduz o valor sozinho — sem isso, mostraria "price-asc" cru na tela. */}
            <SelectValue>{(value: NftSort) => SORT_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
