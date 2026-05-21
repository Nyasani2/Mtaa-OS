import { walletLedgerEngine } from './walletLedgerEngine'
import { railRegistry } from '@/lib/integrations/rails/railRegistry'
import { walletEventBus } from './walletEventBus'

class WalletExecutionService {
  init() {
    walletEventBus.on((event) => {
      switch (event.type) {
        case 'QR_SCANNED':
          this.handleQR(event.payload)
          break

        case 'TRANSFER_INIT':
          this.handleTransfer(event.payload)
          break
      }
    })
  }

  async handleQR(payload: any) {
    try {
      const parsed = JSON.parse(payload.qr || '{}')

      const result = await railRegistry.route('mpesa', {
        amount: parsed.amount || 0,
        phone: parsed.phone,
        metadata: parsed,
      })

      walletEventBus.emit('MPESA_PENDING', result)

      return result
    } catch (err) {
      walletEventBus.emit('TRANSACTION_FAILED', err)
    }
  }

async handleQR(payload: any) {
  try {
    const parsed = JSON.parse(payload.qr || '{}')

    const result = await railRegistry.route('mpesa', {
      amount: parsed.amount || 0,
      phone: parsed.phone,
      metadata: parsed,
    })

    // 🧠 CREATE LEDGER ENTRY (PENDING STATE)
    await walletLedgerEngine.createEntry({
      user_id: parsed.user_id || 'unknown',
      amount: parsed.amount || 0,
      type: 'DEBIT',
      source: 'mpesa',
      reference: result.ref,
      status: 'PENDING',
    })

    walletEventBus.emit('MPESA_PENDING', result)

    return result
  } catch (err) {
    walletEventBus.emit('TRANSACTION_FAILED', err)
  }
}

export const walletExecutionService = new WalletExecutionService()
