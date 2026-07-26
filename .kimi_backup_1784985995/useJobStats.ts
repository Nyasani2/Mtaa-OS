/**
 * MTAA OS V10 — useJobStats Hook
 * Employer analytics: views, applications, hire rate
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface JobStats {
  totalListings: number;
  activeListings: number;
  totalApplications: number;
  pendingApplications: number;
  shortlisted: number;
  hired: number;
  rejected: number;
}

export function useJobStats() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: listings, error: lErr } = await supabase
        .from('jobs_listings')
        .select('id, status')
        .eq('employer_id', userId);
      if (lErr) throw lErr;

      const listingIds = (listings ?? []).map((l: any) => l.id);

      let apps: any[] = [];
      if (listingIds.length > 0) {
        const { data, error: aErr } = await supabase
          .from('job_applications')
          .select('status')
          .in('listing_id', listingIds);
        if (!aErr) apps = data ?? [];
      }

      setStats({
        totalListings: listings?.length ?? 0,
        activeListings: (listings ?? []).filter((l: any) => l.status === 'active').length,
        totalApplications: apps.length,
        pendingApplications: apps.filter((a: any) => a.status === 'pending').length,
        shortlisted: apps.filter((a: any) => a.status === 'shortlisted').length,
        hired: apps.filter((a: any) => a.status === 'hired').length,
        rejected: apps.filter((a: any) => a.status === 'rejected').length,
      });
    } catch (e: any) {
      console.error('Job stats error:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { stats, isLoading, refresh: load };
}
