import { supabase } from '@/lib/supabase';

export const walletHealthService = {
  async getBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("wallet_accounts")
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data?.balance ?? 0;
  },

  async processPayment({
    userId,
    invoiceId,
    amount,
  }: {
    userId: string;
    invoiceId: string;
    amount: number;
  }): Promise<void> {
    // Deduct from wallet
    const { error: deductError } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
    });
    if (deductError) throw deductError;

    // Record health wallet transaction
    const { error: txError } = await supabase
      .from('health_wallet_transactions')
      .insert({
        patient_id: userId,
        transaction_type: 'payment',
        health_context: { invoice_id: invoiceId, amount },
      });
    if (txError) throw txError;

    // Mark invoice as paid
    const { error: invError } = await supabase
      .from('health_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId);
    if (invError) throw invError;
  },
};

