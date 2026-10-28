const STORAGE_KEY = "nft-marketplace:checkout-idempotency-key";

export function readOrCreateIdempotencyKey(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // sessionStorage indisponível (ex.: aba privada) — segue sem persistência.
  }

  const fresh = crypto.randomUUID();
  try {
    sessionStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // idem
  }
  return fresh;
}

export function clearIdempotencyKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}
