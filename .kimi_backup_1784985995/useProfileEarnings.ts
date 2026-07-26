/**
 * MTAA OS V10 — useProfileEarnings Hook
 * Creator earnings dashboard
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchCreatorEarnings, fetchCreatorEarningsSummary, CreatorEarning } from '@/lib/services/profile-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useProfileEarnings() {
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [summary, setSummary] = useState({ totalEarned: 0, totalPending: 0, totalFailed: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [e, s] = await Promise.all([
        fetchCreatorEarnings(userId),
        fetchCreatorEarningsSummary(userId),
      ]);
      setEarnings(e);
      setSummary(s);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { earnings, summary, isLoading, error, refresh: load };
}
