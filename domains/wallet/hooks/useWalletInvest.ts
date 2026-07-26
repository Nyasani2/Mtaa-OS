import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWalletInvest() {
  const [investments, setInvestments] = useState<any[]>([]);

  const fetchInvestments = useCallback(async (userId: string) => {
    const { data } = await supabase.from('wallet_investments').select('*').eq('user_id', userId);
    setInvestments(data || []);
  }, []);

  return { investments, fetchInvestments };
}
