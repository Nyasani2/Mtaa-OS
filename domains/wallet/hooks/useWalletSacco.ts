import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWalletSacco() {
  const [saccoData, setSaccoData] = useState<any>(null);

  const fetchSacco = useCallback(async (userId: string) => {
    const { data } = await supabase.from('wallet_sacco_members').select('*').eq('user_id', userId).single();
    setSaccoData(data);
  }, []);

  return { saccoData, fetchSacco };
}
