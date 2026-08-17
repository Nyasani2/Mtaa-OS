import { WalletCoreEngine } from "./walletCoreEngine";

export type WalletEventType = "QR_SCANNED" | "TRANSFER_INIT" | "BALANCE_REQUEST" | "PAYMENT_REQUEST";

export function walletExecutionPipeline(event: { type: WalletEventType; payload?: any }) {
  const engine = new WalletCoreEngine();

  switch (event.type) {
    case "QR_SCANNED":
      return engine.processQR(event.payload?.data);
    case "TRANSFER_INIT":
      return engine.processTransfer(event.payload);
    case "BALANCE_REQUEST":
      return engine.getBalance();
    default:
      return Promise.resolve({ success: false, error: "Unknown event type" });
  }
}

