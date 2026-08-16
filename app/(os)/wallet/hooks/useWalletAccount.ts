import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WalletAccount {
  id: string;
  user_id: string;
  balance: number;
  held_balance: number;
  currency: string;
  status: string;
  tier: string;
  created_at: string;
}

export function useWalletAccount() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
    if (error) setError(error.message);
    else setWallet(data as WalletAccount);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  return { wallet, loading, error, balance: wallet?.balance || 0, loadWallet };
}
