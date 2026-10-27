const TOKEN_KEY = "nft-marketplace:token";

/**
 * Onde o "crachá" (token) fica guardado no navegador entre uma visita e outra.
 * Separado do mocks/db.ts de propósito: num app real, o token não mora no
 * "banco de dados" — mora só no dispositivo de quem está logado.
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage bloqueado (ex.: modo privado): a sessão só não sobrevive a um refresh.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Idem.
  }
}
