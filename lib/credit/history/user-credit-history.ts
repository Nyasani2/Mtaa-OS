import { supabase } from '@/lib/supabase';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'transfer' | 'debit' | 'loan' | 'investment' | 'reward';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export async function getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CreditTransaction[];
}

export async function getCreditStats(userId: string) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('type, amount', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (error) throw error;

  const stats = { total: 0, byType: {} as Record<string, number> };
  data?.forEach((row: any) => {
    stats.total += row.amount;
    stats.byType[row.type] = (stats.byType[row.type] || 0) + row.amount;
  });
  return stats;
}
