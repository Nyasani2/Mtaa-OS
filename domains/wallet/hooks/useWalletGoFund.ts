import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWalletGoFund() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchCampaigns = useCallback(async () => {
    const { data } = await supabase.from('wallet_gofund_campaigns').select('*');
    setCampaigns(data || []);
  }, []);

  return { campaigns, fetchCampaigns };
}
