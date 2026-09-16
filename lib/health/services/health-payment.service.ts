import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'wallet' | 'insurance';

export interface PaymentPayload {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  policyId?: string;
}

export class HealthPaymentService {
  static async processPayment(payload: PaymentPayload) {
    const { data: invoice, error: invError } = await supabase
      .from('health_invoices')
      .select('*, patient:patient_id(user_id)')
      .eq('id', payload.invoiceId)
      .single();

    if (invError || !invoice) throw new Error('Invoice not found');

    if (payload.method === 'wallet') {
      return await this.payWithWallet(invoice, payload.amount);
    } else if (payload.method === 'insurance') {
      if (!payload.policyId) throw new Error('Policy ID required for insurance payment');
      return await this.payWithInsurance(invoice, payload.amount, payload.policyId);
    }
  }

  private static async payWithWallet(invoice: any, amount: number) {
    const { error: deductError } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: invoice.patient.user_id,
      p_amount: amount,
    });
    if (deductError) throw new Error('Insufficient wallet balance or wallet error');

    await supabase.from('health_wallet_transactions').insert({
      patient_id: invoice.patient_id,
      transaction_type: 'health_payment',
      amount: amount,
      reference_id: invoice.id,
      status: 'completed',
    });

    const newBalance = (invoice.balance_due || invoice.total_amount) - amount;
    const status = newBalance <= 0 ? 'paid' : 'partial';
    
    await supabase.from('health_invoices').update({
      status: status,
      balance_due: newBalance,
      paid_at: new Date().toISOString(),
    }).eq('id', invoice.id);

    return { success: true, method: 'wallet', remaining_balance: newBalance };
  }

  private static async payWithInsurance(invoice: any, amount: number, policyId: string) {
    const { data: policy, error: polError } = await supabase
      .from('health_policies')
      .select('coverage_limit, used_amount, provider_name')
      .eq('id', policyId)
      .single();

    if (polError || !policy) throw new Error('Insurance policy not found');

    const remainingLimit = (policy.coverage_limit || 0) - (policy.used_amount || 0);
    if (remainingLimit < amount) {
      throw new Error(`Insurance limit exceeded. Available: ${remainingLimit}`);
    }

    await supabase.from('health_claims').insert({
      invoice_id: invoice.id,
      policy_id: policyId,
      amount_claimed: amount,
      status: 'approved',
      approved_at: new Date().toISOString(),
    });

    await supabase.from('health_policies').update({
      used_amount: (policy.used_amount || 0) + amount
    }).eq('id', policyId);

    const newBalance = (invoice.balance_due || invoice.total_amount) - amount;
    const status = newBalance <= 0 ? 'paid' : 'partial';

    await supabase.from('health_invoices').update({
      status: status,
      balance_due: newBalance,
      paid_at: new Date().toISOString(),
    }).eq('id', invoice.id);

    return { success: true, method: 'insurance', remaining_balance: newBalance };
  }
}
