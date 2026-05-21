import { mpesaAdapter } from './mpesaAdapter'

type PaymentPayload = {
  amount: number
  phone?: string
  account?: string
  metadata?: any
}

class RailRegistry {
  async route(
    type: 'mpesa' | 'card' | 'bank',
    payload: PaymentPayload
  ) {
    switch (type) {
      case 'mpesa':
        return this.mpesa(payload)

      case 'card':
        return this.card(payload)

      case 'bank':
        return this.bank(payload)

      default:
        throw new Error(`Unsupported rail type: ${type}`)
    }
  }

  // =========================
  // MPESA RAIL (PRIMARY)
  // =========================
  private async mpesa(payload: PaymentPayload) {
    const res = await mpesaAdapter.stkPush({
      phone: payload.phone || '',
      amount: payload.amount,
      accountReference: payload.metadata?.ref,
      description: payload.metadata?.description || 'MTAA Wallet Payment',
    })

    return {
      status: res.status,
      rail: 'mpesa',
      ref: res.checkoutRequestID,
      message: res.message,
    }
  }

  // =========================
  // CARD RAIL (STAGING)
  // =========================
  private async card(payload: PaymentPayload) {
    console.log('CARD PAYMENT INIT:', payload)

    return {
      status: 'PENDING',
      rail: 'card',
      ref: 'CARD_TX_' + Date.now(),
      message: 'Card rail is in staging mode',
    }
  }

  // =========================
  // BANK RAIL (STAGING)
  // =========================
  private async bank(payload: PaymentPayload) {
    console.log('BANK TRANSFER INIT:', payload)

    return {
      status: 'PENDING',
      rail: 'bank',
      ref: 'BANK_TX_' + Date.now(),
      message: 'Bank rail is in staging mode',
    }
  }
}

export const railRegistry = new RailRegistry()
