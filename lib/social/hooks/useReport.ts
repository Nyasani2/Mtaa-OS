import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export type ReportType = 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'scam' | 'other';

export function useReport() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { profile } = useAuthStore() as any;
  const myProfileId = profile?.id;

  const report = useCallback(async (targetProfileId: string, reportType: ReportType, description?: string) => {
    if (!myProfileId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_reports')
        .insert({
          reporter_profile_id: myProfileId,
          reported_profile_id: targetProfileId,
          report_type: reportType,
          description,
        });
      if (error) throw error;
      setSuccess(true);
    } finally { setLoading(false); }
  }, [myProfileId]);

  return { report, loading, success, reset: () => setSuccess(false) };
}
