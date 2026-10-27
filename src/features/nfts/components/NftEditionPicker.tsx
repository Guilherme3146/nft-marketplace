import type { NftEdition } from "../types";

interface NftEditionPickerProps {
  editions: NftEdition[];
  selectedEditionId: string | undefined;
  onSelect: (editionId: string) => void;
}

export function NftEditionPicker({
  editions,
  selectedEditionId,
  onSelect,
}: NftEditionPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[15px] font-bold text-foreground">Edição:</p>
      <div role="radiogroup" aria-label="Edição" className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const isSoldOut = edition.available === 0;
          const isSelected = edition.id === selectedEditionId;
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isSoldOut}
              onClick={() => onSelect(edition.id)}
              className={
                isSelected
                  ? "rounded-full border border-primary px-4 py-1 text-sm font-medium text-accent"
                  : "rounded-full border border-border px-4 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              {edition.label}
              {isSoldOut ? " · Esgotado" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
