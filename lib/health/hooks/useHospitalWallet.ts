import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useHospitalWallet(facilityId?: string | null) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('user_id', facilityId)
        .maybeSingle();
      setWallet(data);
      setBalance(data?.balance || 0);

      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(txs || []);

      setStats({
        commissionRate: 2.5,
        netRevenue: data?.balance || 0,
        todayRevenue: Math.floor((data?.balance || 0) * 0.05),
        monthRevenue: data?.balance || 0,
        totalTransactions: txs?.length || 0,
        commissionPaid: 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  const withdraw = async (amount: number) => {
    console.log('Withdraw', amount);
  };

  return { wallet, transactions, balance, stats, loading, refresh, withdraw };
}
