/**
 * MTAA OS V10 — useWalletInvest Hook
 * Investment portfolio: create, track, withdraw
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchWalletInvestments, createInvestment, withdrawInvestment, WalletInvestment } from '@/lib/services/wallet-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletInvest() {
  const [investments, setInvestments] = useState<WalletInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWalletInvestments(userId);
      setInvestments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const invest = useCallback(async (payload: Partial<WalletInvestment>) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createInvestment(userId, payload);
    setInvestments((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const withdraw = useCallback(async (investmentId: string) => {
    const item = await withdrawInvestment(investmentId);
    setInvestments((prev) => prev.map((i) => (i.id === investmentId ? item : i)));
    return item;
  }, []);

  const portfolioValue = investments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.current_value, 0);

  useEffect(() => { load(); }, [load]);

  return { investments, portfolioValue, isLoading, error, refresh: load, invest, withdraw };
}
