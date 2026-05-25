import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export function useWalletStore() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setWallet(null); setTransactions([]); return; }

      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      setWallet(walletData);

      if (walletData) {
        const { data: txData } = await supabase.from('transactions').select('*').eq('wallet_id', walletData.id).order('created_at', { ascending: false }).limit(50);
        setTransactions(txData || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const transfer = useCallback(async (recipientPhone: string, amount: number, description?: string) => {
    const { data, error } = await supabase.functions.invoke('transfer-funds', {
      body: { recipientPhone, amount, description },
    });
    if (error) throw error;
    await refresh();
    return data;
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  return { wallet, transactions, loading, error, refresh, transfer };
}
