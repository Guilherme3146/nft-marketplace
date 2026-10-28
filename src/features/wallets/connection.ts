const STORAGE_KEY = "nft-marketplace:wallet-connected";

export function isWalletConnected(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWalletConnected(connected: boolean): void {
  try {
    if (connected) sessionStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage indisponível — a simulação de conexão fica só nesta renderização.
  }
}
