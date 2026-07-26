/**
 * MTAA OS V10 — useJobApplications Hook
 * Apply to jobs + employer application management
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchJobApplications,
  createJobApplication,
  updateJobApplicationStatus,
  JobApplication,
} from '@/lib/services/jobs-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useJobApplications(listingId?: string) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadForListing = useCallback(async () => {
    if (!listingId) return;
    setIsLoading(true);
    try {
      const data = await fetchJobApplications({ listingId });
      setApplications(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  const loadMyApplications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fetchJobApplications({ applicantId: userId });
      setMyApplications(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const apply = useCallback(async (listingId: string, coverLetter?: string, resumeUrl?: string) => {
    if (!userId) throw new Error('Not authenticated');
    const app = await createJobApplication({
      listing_id: listingId,
      applicant_id: userId,
      cover_letter: coverLetter ?? null,
      resume_url: resumeUrl ?? null,
      status: 'pending',
    });
    setMyApplications((prev) => [app, ...prev]);
    return app;
  }, [userId]);

  const updateStatus = useCallback(async (appId: string, status: JobApplication['status']) => {
    const updated = await updateJobApplicationStatus(appId, status);
    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    return updated;
  }, []);

  useEffect(() => {
    loadForListing();
    loadMyApplications();
  }, [loadForListing, loadMyApplications]);

  return {
    applications, myApplications, isLoading, error,
    refresh: loadForListing, refreshMine: loadMyApplications,
    apply, updateStatus,
  };
}
