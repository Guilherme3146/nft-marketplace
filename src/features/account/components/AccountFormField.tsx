import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export const accountInputClass =
  "h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-secondary";

interface AccountFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function AccountFormField({ label, required = true, error, children }: AccountFormFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-[15px] text-foreground">
      <span className="flex items-center gap-1">
        {label}
        {required ? <span className="text-[22px] leading-none text-text-coral">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

/** Campo "Nome ENS": input + sufixo fixo ".eth" (o Figma mostra isso como um select de 1 opção só). */
export function EnsField({ register }: { register: UseFormRegisterReturn }) {
  return (
    <div className="flex h-10 overflow-hidden rounded-[3px] border border-border">
      <input {...register} className="w-full flex-1 bg-transparent px-3 text-sm text-foreground" />
      <span className="flex items-center bg-surface-raised px-3 text-sm text-secondary">.eth</span>
    </div>
  );
}
