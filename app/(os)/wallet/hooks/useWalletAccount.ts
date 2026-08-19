import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface WalletAccount {
  id: string; user_id: string; balance: number;
  available_balance: number; hold_balance: number;
  currency: string; status: string; is_default: boolean;
}

export const useWalletAccount = () => {
  const { user } = useAuthStore();
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('wallet_accounts').select('*')
        .eq('user_id', user.id).eq('is_default', true).maybeSingle();
      if (dbError) throw dbError;
      setAccount(data || null);
    } catch (e: any) { setError(e.message || 'Failed to load wallet'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { account, loading, error, refresh };
};
export default useWalletAccount;
