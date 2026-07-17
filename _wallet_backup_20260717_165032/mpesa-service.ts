import { supabase } from '@/lib/supabase';

export interface MPesaTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  phone_number: string;
  amount: number;
  transaction_code?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  checkout_request_id?: string;
  merchant_request_id?: string;
  result_code?: number;
  result_desc?: string;
  created_at: string;
  updated_at: string;
}

export interface STKPushRequest {
  phone_number: string;
  amount: number;
  wallet_id: string;
  account_reference?: string;
  transaction_desc?: string;
}

export interface STKPushResponse {
  success: boolean;
  checkout_request_id?: string;
  merchant_request_id?: string;
  message: string;
  error?: string;
}

export class MPesaService {
  /**
   * Initiate STK Push (PayBill or Till Number)
   */
  static async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        phone_number: request.phone_number,
        amount: request.amount,
        wallet_id: request.wallet_id,
        account_reference: request.account_reference || 'MTAA-WALLET-TOPUP',
        transaction_desc: request.transaction_desc || 'Wallet Top Up',
      },
    });

    if (error) {
      console.error('[MPesaService] STK Push error:', error);
      return { success: false, message: error.message || 'Failed to initiate payment' };
    }

    return {
      success: true,
      checkout_request_id: data?.checkout_request_id,
      merchant_request_id: data?.merchant_request_id,
      message: data?.message || 'STK Push sent to your phone. Enter PIN to complete.',
    };
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(checkoutRequestId: string): Promise<MPesaTransaction | null> {
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (error) {
      console.error('[MPesaService] Status check error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's MPesa transaction history
   */
  static async getTransactionHistory(userId: string, limit = 20): Promise<MPesaTransaction[]> {
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[MPesaService] History error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get pending transactions
   */
  static async getPendingTransactions(userId: string): Promise<MPesaTransaction[]> {
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MPesaService] Pending error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Format phone number for MPesa (2547XXXXXXXX)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If starts with 7, add 254
    if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate phone number
   */
  static isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^2547[0-9]{8}$/.test(formatted);
  }
}

export default MPesaService;
