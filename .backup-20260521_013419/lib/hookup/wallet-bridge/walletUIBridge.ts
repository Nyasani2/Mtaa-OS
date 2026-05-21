import { walletCoreEngine } from './walletCoreEngine'
import { walletEventBus } from './walletEventBus'

export const walletUIBridge = {
  scanAndPay: async (qrData: string) => {
    walletEventBus.emit('QR_SCANNED', {
      qr: qrData,
      timestamp: Date.now(),
    })

    return walletCoreEngine.processQR(qrData)
  },

  initiateTransfer: async (payload: any) => {
    walletEventBus.emit('TRANSFER_INIT', payload)
    return walletCoreEngine.processTransfer(payload)
  },

  requestBalance: async () => {
    walletEventBus.emit('BALANCE_REQUEST')
    return walletCoreEngine.getBalance()
  },
}
