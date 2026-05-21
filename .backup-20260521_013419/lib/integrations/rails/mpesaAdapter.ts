import { supabase } from '@/lib/supabase'

type MpesaPayload = {
  phone: string
  amount: number
  accountReference?: string
  description?: string
}

class MpesaAdapter {
  async stkPush(payload: MpesaPayload) {
    try {
      const { data, error } =
        await supabase.functions.invoke(
          'mpesa-stk-push',
          {
            body: {
              phone: payload.phone,
              amount: payload.amount,
              accountReference:
                payload.accountReference || 'MTAA',
              transactionDesc:
                payload.description ||
                'MTAA Wallet Payment',
            },
          }
        )

      if (error) {
        throw error
      }

      return {
        success: true,
        status: 'PENDING',
        checkoutRequestID:
          data?.CheckoutRequestID,
        merchantRequestID:
          data?.MerchantRequestID,
        responseCode:
          data?.ResponseCode,
        responseDescription:
          data?.ResponseDescription,
        customerMessage:
          data?.CustomerMessage,
      }
    } catch (err: any) {
      console.error('MPESA STK ERROR:', err)

      return {
        success: false,
        status: 'FAILED',
        error: String(err),
      }
    }
  }

  async validateCallback(data: any) {
    return {
      valid: true,
      raw: data,
    }
  }

  async confirmPayment(data: any) {
    return {
      success: true,
      transactionId:
        data?.CheckoutRequestID,
      status: 'CONFIRMED',
    }
  }
}

export const mpesaAdapter =
  new MpesaAdapter()
