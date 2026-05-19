import { walletEventBus } from './walletEventBus'
import { walletCoreEngine } from './walletCoreEngine'

/**
 * MTAA Wallet Execution Pipeline
 * ------------------------------
 * Central decision layer between:
 * EventBus → Core Engine → Payment Rails
 */

class WalletExecutionPipeline {
  private initialized = false

  init() {
    if (this.initialized) return
    this.initialized = true

    // QR PAYMENT FLOW
    walletEventBus.on(async (event) => {
      switch (event.type) {
        case 'QR_SCANNED':
          await this.handleQR(event.payload)
          break

        case 'TRANSFER_INIT':
          await this.handleTransfer(event.payload)
          break
      }
    })
  }

  async handleQR(payload: any) {
    try {
      return await walletCoreEngine.processQR(payload.qr)
    } catch (err) {
      walletEventBus.emit('TRANSACTION_FAILED', err)
    }
  }

  async handleTransfer(payload: any) {
    try {
      return await walletCoreEngine.processTransfer(payload)
    } catch (err) {
      walletEventBus.emit('TRANSACTION_FAILED', err)
    }
  }
}

// SINGLETON
export const walletExecutionPipeline = new WalletExecutionPipeline()
