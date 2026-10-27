import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { NftCategory, NftListResponse } from "../types";
import { CATEGORY_LABELS } from "../category-labels";

const NETWORKS = [
  { name: "Ethereum", count: 119 },
  { name: "Polygon", count: 78 },
  { name: "Solana", count: 86 },
];

const PRICE_MIN = 0;
const PRICE_MAX = 15;

interface CatalogFiltersProps {
  facets: NftListResponse["facets"] | undefined;
  selectedCategories: NftCategory[];
  onToggleCategory: (category: NftCategory) => void;
  onApplyPriceRange: (minPrice: string, maxPrice: string) => void;
}

export function CatalogFilters({
  facets,
  selectedCategories,
  onToggleCategory,
  onApplyPriceRange,
}: CatalogFiltersProps) {
  const [range, setRange] = useState<number[]>([PRICE_MIN, PRICE_MAX]);

  return (
    <div className="flex w-full flex-col gap-10 rounded-xl bg-card p-5 lg:w-[310px] lg:shrink-0">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">Coleções</h2>
        <ul className="flex flex-col gap-1 px-3">
          {facets?.categories.map((facet) => {
            const category = facet.value as NftCategory;
            const isSelected = selectedCategories.includes(category);
            const label = CATEGORY_LABELS[category] ?? facet.value;
            return (
              <li key={category}>
                <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleCategory(category)}
                    />
                    <span
                      className={
                        isSelected
                          ? "text-[15px] text-accent"
                          : "text-[15px] text-muted-foreground"
                      }
                    >
                      {label}
                    </span>
                  </span>
                  <span
                    className={
                      isSelected
                        ? "text-[15px] font-bold text-accent"
                        : "text-[15px] font-bold text-muted-foreground"
                    }
                  >
                    ({facet.count})
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">Faixa de preço</h2>
        <div className="flex flex-col gap-3 pl-3">
          <Slider
            value={range}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={0.01}
            onValueChange={(value) => setRange(value as number[])}
          />
          <p className="text-[15px] text-foreground">
            Preço: {range[0].toFixed(2)} - {range[1].toFixed(2)} ETH
          </p>
          <Button
            type="button"
            onClick={() =>
              onApplyPriceRange(range[0].toFixed(2), range[1].toFixed(2))
            }
            className="w-fit"
          >
            Aplicar
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">Rede</h2>
        <ul className="flex flex-col gap-1 pl-3 text-[15px] text-muted-foreground">
          {NETWORKS.map((network) => (
            <li key={network.name} className="flex items-center justify-between py-1">
              <span>{network.name}</span>
              <span>({network.count})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
