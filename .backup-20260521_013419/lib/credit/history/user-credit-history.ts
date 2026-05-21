import { supabase } from '@/lib/supabase';

export async function getUserFinancialHistory(user_id: string) {
  const { data: txns } = await supabase
    .select('*')
    .eq('user_id', user_id);

  const { data: loans } = await supabase
    .from('loan_repayments')
    .select('*')
    .eq('user_id', user_id);

  const totalPaid = (loans || []).reduce((s, l) => s + Number(l.amount), 0);
  const totalSpent = (txns || [])
    .filter(t => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);

  return {
    totalPaid,
    totalSpent,
    reliability_index: totalPaid > totalSpent ? 0.8 : 0.4,
    activity_score: Math.min((txns?.length || 0) / 50, 1),
  };
}
