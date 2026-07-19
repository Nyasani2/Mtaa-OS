import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useHospitalWallet(facilityId: string | null) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!facilityId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: facility } = await supabase.from('health_facilities').select('wallet_id, revenue_today, revenue_this_month, total_transactions, commission_rate').eq('id', facilityId).single();
      if (facility?.wallet_id) {
        const { data: w } = await supabase.from('wallet_accounts').select('*').eq('id', facility.wallet_id).single();
        setWallet(w); setBalance(w?.balance || 0);
        const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('wallet_id', facility.wallet_id).order('created_at', { ascending: false }).limit(50);
        setTransactions(txs || []);
      }
      setStats({ todayRevenue: facility?.revenue_today || 0, monthRevenue: facility?.revenue_this_month || 0, totalTransactions: facility?.total_transactions || 0, commissionRate: facility?.commission_rate || 2.5, commissionPaid: (facility?.revenue_this_month || 0) * ((facility?.commission_rate || 2.5) / 100), netRevenue: (facility?.revenue_this_month || 0) * (1 - (facility?.commission_rate || 2.5) / 100) });
    } finally { setLoading(false); }
  }, [facilityId, supabase]);

  const withdraw = useCallback(async (amount: number) => {
    if (!wallet) return;
    const { error } = await supabase.rpc('wallet_withdraw', { p_wallet_id: wallet.id, p_amount: amount });
    if (!error) fetchData();
  }, [wallet, supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { wallet, transactions, balance, stats, loading, refresh: fetchData, withdraw };
}
