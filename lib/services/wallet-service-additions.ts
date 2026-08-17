import { supabase } from '@/lib/supabase';

export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from("wallet_accounts")
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getWalletTransactions(userId: string) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createWalletTransaction(params: any) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWalletBalance(userId: string, amount: number) {
  const { data, error } = await supabase
    .from("wallet_accounts")
    .update({ balance: amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Pay school fees — deducts from parent wallet, creates education transaction record.
 * Uses mtaa_process_payment for the actual wallet deduction.
 */
export async function paySchoolFee(params: {
  institutionId: string;
  amount: number;
  currency: string;
  description: string;
  studentId: string;
  userId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { institutionId, amount, currency, description, studentId, userId } = params;

  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Use mtaa_process_payment to deduct from parent wallet and credit institution
    const { error } = await supabase.rpc('mtaa_process_payment', {
      p_from_user_id: userId,
      p_to_user_id: institutionId,  // Institution acts as receiver
      p_total_amount: amount,
      p_type: 'education_fee',
      p_reference: `fee-${studentId}-${Date.now()}`
    });

    if (error) {
      console.error('[paySchoolFee] Payment error:', error);
      return { success: false, error: error.message };
    }

    // Record in education_fee_payments table if it exists
    try {
      await supabase.from('education_fee_payments').insert({
        student_id: studentId,
        institution_id: institutionId,
        amount,
        currency,
        description,
        paid_by: userId,
        status: 'paid',
        paid_at: new Date().toISOString()
      });
    } catch (e) {
      // Table may not exist — payment already succeeded via RPC
      console.warn('[paySchoolFee] education_fee_payments table not found, but wallet payment succeeded');
    }

    return { success: true };
  } catch (err: any) {
    console.error('[paySchoolFee] Error:', err);
    return { success: false, error: err.message || 'Payment failed' };
  }
}

