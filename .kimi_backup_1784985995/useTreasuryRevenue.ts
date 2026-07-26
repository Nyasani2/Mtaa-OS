/**
 * MTAA OS V10 — useTreasuryRevenue Hook
 * Revenue collection + verification workflow
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchTreasuryRevenue,
  createTreasuryRevenue,
  verifyRevenue,
  TreasuryRevenue,
} from '@/lib/services/treasury-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useTreasuryRevenue() {
  const [items, setItems] = useState<TreasuryRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTreasuryRevenue({ status });
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const collect = useCallback(async (payload: Partial<TreasuryRevenue>) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createTreasuryRevenue({ ...payload, collector_id: userId, status: 'pending' });
    setItems((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const verify = useCallback(async (id: string) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await verifyRevenue(id, userId);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { items, isLoading, error, refresh: load, collect, verify };
}
