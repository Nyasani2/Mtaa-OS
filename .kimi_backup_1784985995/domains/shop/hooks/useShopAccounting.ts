import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert } from 'react-native';

export interface ShopTransaction {
  id: string;
  shop_id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'refund' | 'withdrawal';
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AccountingSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalOrders: number;
  pendingPayouts: number;
}

export function useShopAccounting(shopId?: string) {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<ShopTransaction[]>([]);
  const [summary, setSummary] = useState<AccountingSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalOrders: 0,
    pendingPayouts: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_transactions')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (err) throw err;
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const fetchSummary = useCallback(async () => {
    if (!shopId) return;
    try {
      const { data: revenueData, error: revErr } = await supabase
        .from('shop_transactions')
        .select('amount, type')
        .eq('shop_id', shopId);
      if (revErr) throw revErr;

      const { data: ordersData, error: ordErr } = await supabase
        .from('shop_orders')
        .select('id, status, payment_status')
        .eq('shop_id', shopId);
      if (ordErr) throw ordErr;

      const totalRevenue = (revenueData || [])
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const totalExpenses = (revenueData || [])
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const pendingPayouts = (ordersData || [])
        .filter((o: any) => o.payment_status === 'pending')
        .length;

      setSummary({
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        totalOrders: ordersData?.length || 0,
        pendingPayouts,
      });
    } catch (err: any) {
      console.error('fetchSummary error:', err.message);
    }
  }, [shopId]);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  const addTransaction = useCallback(async (txn: Partial<ShopTransaction>) => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in');
      return null;
    }
    try {
      const { data, error: err } = await supabase
        .from('shop_transactions')
        .insert({ ...txn, shop_id: shopId, created_by: user.id })
        .select()
        .single();
      if (err) throw err;
      setTransactions(prev => [data, ...prev]);
      fetchSummary();
      return data;
    } catch (err: any) {
      Alert.alert('Error', err.message);
      return null;
    }
  }, [user, shopId, fetchSummary]);

  return {
    transactions,
    summary,
    loading,
    error,
    fetchTransactions,
    fetchSummary,
    addTransaction,
    user,
  };
}
