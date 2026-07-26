/**
 * MTAA OS V10 — useWalletSacco Hook
 * SACCO contributions + history
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchWalletSacco, createSaccoContribution } from '@/lib/services/wallet-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletSacco() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWalletSacco(userId);
      setContributions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const contribute = useCallback(async (amount: number, saccoName: string) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createSaccoContribution(userId, amount, saccoName);
    setContributions((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const totalContributed = contributions.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  useEffect(() => { load(); }, [load]);

  return { contributions, totalContributed, isLoading, error, refresh: load, contribute };
}
