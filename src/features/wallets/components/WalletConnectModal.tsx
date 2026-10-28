import { useEffect } from "react";
import { Dialog, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { isApiError } from "@/lib/api";
import { setWalletConnected } from "../connection";
import { useConnectWallet } from "../queries";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function WalletConnectModal({ open, onOpenChange, onConnected }: WalletConnectModalProps) {
  const connectWallet = useConnectWallet();

  useEffect(() => {
    if (!open) return;
    connectWallet.mutate(undefined, {
      onSuccess: () => {
        setWalletConnected(true);
        onConnected();
      },
    });
    // Dispara só quando o modal abre, não a cada re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleRetry() {
    connectWallet.reset();
    connectWallet.mutate(undefined, {
      onSuccess: () => {
        setWalletConnected(true);
        onConnected();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        {connectWallet.isPending || connectWallet.isIdle ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              role="status"
              aria-label="Conectando carteira"
              className="size-10 animate-spin rounded-full border-4 border-border border-t-accent"
            />
            <DialogTitle>Conectando à sua carteira...</DialogTitle>
            <DialogDescription>Aprove a conexão na extensão da sua carteira.</DialogDescription>
          </div>
        ) : connectWallet.isError ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <DialogTitle className="text-destructive">Conexão recusada</DialogTitle>
            <DialogDescription>
              {isApiError(connectWallet.error)
                ? connectWallet.error.message
                : "Não foi possível conectar à carteira."}
            </DialogDescription>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="h-10 rounded-sm bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-sm border border-border px-4 text-sm text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
