import { supabase } from '@/lib/supabase/client';

export interface StkPushResult { success: boolean; checkoutRequestId?: string; merchantRequestId?: string; paymentId?: string; error?: string; }
export interface PaymentStatus { status: 'pending' | 'processing' | 'completed' | 'failed'; receipt?: string; amount?: number; senderName?: string; senderPhone?: string; completedAt?: string; failureReason?: string; }

class DarajaService {
  async initiateTillPayment(tillNumber: string, customerPhone: string, amount: number): Promise<StkPushResult> {
    const { data, error } = await supabase.functions.invoke('business-stk-push', { body: { type: 'till', tillNumber, customerPhone, amount } });
    if (error) return { success: false, error: error.message };
    return { success: data.success, checkoutRequestId: data.checkoutRequestId, merchantRequestId: data.merchantRequestId, paymentId: data.paymentId, error: data.error };
  }

  async initiatePaybillPayment(paybillNumber: string, accountNumber: string, customerPhone: string, amount: number): Promise<StkPushResult> {
    const { data, error } = await supabase.functions.invoke('business-stk-push', { body: { type: 'paybill', paybillNumber, accountNumber, customerPhone, amount } });
    if (error) return { success: false, error: error.message };
    return { success: data.success, checkoutRequestId: data.checkoutRequestId, merchantRequestId: data.merchantRequestId, paymentId: data.paymentId, error: data.error };
  }

  async checkPaymentStatus(paymentId: string, type: 'till' | 'paybill'): Promise<PaymentStatus> {
    const table = type === 'till' ? 'till_payments' : 'paybill_payments';
    const { data, error } = await supabase.from(table).select('status, mpesa_receipt, amount, sender_name, sender_phone, completed_at, failure_reason').eq('id', paymentId).single();
    if (error || !data) return { status: 'pending' };
    return { status: data.status, receipt: data.mpesa_receipt, amount: data.amount, senderName: data.sender_name, senderPhone: data.sender_phone, completedAt: data.completed_at, failureReason: data.failure_reason };
  }

  generateTillQrData(tillNumber: string, businessName: string): string {
    return JSON.stringify({ type: 'mtaa_till', tillNumber, businessName, generatedAt: Date.now() });
  }

  generatePaybillQrData(paybillNumber: string, accountNumber: string, businessName: string): string {
    return JSON.stringify({ type: 'mtaa_paybill', paybillNumber, accountNumber, businessName, generatedAt: Date.now() });
  }

  parseQrData(qrData: string): { type: string; [key: string]: any } | null {
    try { return JSON.parse(qrData); } catch { return null; }
  }
}

export const darajaService = new DarajaService();
