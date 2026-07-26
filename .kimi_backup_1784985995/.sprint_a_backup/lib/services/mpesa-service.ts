// ============================================================
// MTAA OS V10 — Canonical M-Pesa Service (Consumer)
// Single frontend service for consumer M-Pesa operations
// Calls: supabase/functions/mpesa-stk-push/ (STK push)
//        supabase/functions/mpesa-stk-push/callback-handler (callbacks)
// ============================================================

import { supabase } from '@/lib/supabase';

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}

export interface StkPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  error?: string;
}

export interface TransactionStatus {
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  phoneNumber: string;
  receiptNumber?: string;
  transactionDate?: string;
}

class MpesaService {
  /** Initiate STK push for consumer deposit */
  async initiateStkPush(request: StkPushRequest): Promise<StkPushResponse> {
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        phoneNumber: request.phoneNumber,
        amount: request.amount,
        accountReference: request.accountReference || 'MTAA Deposit',
        transactionDesc: request.transactionDesc || 'Wallet deposit',
      },
    });

    if (error) {
      console.error('[M-Pesa] STK push failed:', error);
      return { success: false, error: error.message };
    }

    return data as StkPushResponse;
  }

  /** Check transaction status by checkout request ID */
  async checkTransactionStatus(checkoutRequestId: string): Promise<TransactionStatus | null> {
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        action: 'check_status',
        checkoutRequestId,
      },
    });

    if (error) {
      console.error('[M-Pesa] Status check failed:', error);
      return null;
    }

    return data as TransactionStatus;
  }

  /** Process callback from Safaricom (called by edge function, not frontend) */
  async processCallback(callbackData: Record<string, any>): Promise<void> {
    // This is handled by the edge function callback handler
    // Frontend should not call this directly
    console.warn('[M-Pesa] processCallback should be called by edge function only');
  }
}

export const mpesaService = new MpesaService();
