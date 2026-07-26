/**
 * MTAA OS V10 — useWalletGoFund Hook
 * GoFund campaigns: create, donate, track
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchWalletGoFund, createGoFundCampaign } from '@/lib/services/wallet-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletGoFund() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWalletGoFund(userId);
      setCampaigns(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createCampaign = useCallback(async (payload: any) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createGoFundCampaign(userId, payload);
    setCampaigns((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const donate = useCallback(async (campaignId: string, amount: number) => {
    if (!userId) throw new Error('Not authenticated');
    const { supabase } = await import('@/lib/supabase/client');
    const { data, error } = await supabase.from('wallet_gofund_donations').insert({
      campaign_id: campaignId,
      donor_id: userId,
      amount,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    // Update campaign raised amount
    await supabase.rpc('increment_gofund_raised', { campaign_id: campaignId, amount });
    return data;
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { campaigns, isLoading, error, refresh: load, createCampaign, donate };
}
