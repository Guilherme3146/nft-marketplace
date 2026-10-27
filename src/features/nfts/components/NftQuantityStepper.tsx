interface NftQuantityStepperProps {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
}

export function NftQuantityStepper({
  quantity,
  max,
  onChange,
}: NftQuantityStepperProps) {
  const disabled = max === 0;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        aria-label="Diminuir quantidade"
        className="flex size-9 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="w-6 text-center text-xl text-foreground">{quantity}</span>
      <button
        type="button"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        aria-label="Aumentar quantidade"
        className="flex size-9 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
