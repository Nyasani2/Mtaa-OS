// @ts-nocheck
import { WalletCoreEngine } from "./walletCoreEngine";
import type { WalletEventType } from "./walletExecutionPipeline";

export function walletUIBridge() {
  const engine = new WalletCoreEngine();

  return {
    handleQRScan: (data: string) => engine.processQR(data),
    handleTransfer: (payload: any) => engine.processTransfer(payload),
    handleBalanceRequest: () => engine.getBalance(),
  };
}

