import { supabase } from '@/lib/supabase';

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
}

export interface StkPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
}

export const darajaService = {
  async stkPush(request: StkPushRequest): Promise<StkPushResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('daraja-stk-push', {
        body: {
          phone_number: request.phoneNumber,
          amount: request.amount,
          account_reference: request.accountReference,
          transaction_desc: request.transactionDesc || 'MTAA Payment',
        },
      });
      if (error) throw error;
      return { success: true, ...data };
    } catch (err: any) {
      console.error('STK Push error:', err);
      return { success: false, error: err.message || 'STK Push failed' };
    }
  },

  async queryStatus(checkoutRequestId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('daraja-query-status', {
        body: { checkout_request_id: checkoutRequestId },
      });
      if (error) throw error;
      return { success: true, status: data?.status };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async registerUrls(confirmationUrl: string, validationUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('daraja-register-urls', {
        body: { confirmation_url: confirmationUrl, validation_url: validationUrl },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Register URLs error:', err);
      return false;
    }
  },
};
