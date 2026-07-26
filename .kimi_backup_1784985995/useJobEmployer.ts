/**
 * MTAA OS V10 — useJobEmployer Hook
 * Employer dashboard: listings, applicants, company profile
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchJobListings,
  fetchJobApplications,
  updateJobApplicationStatus,
  fetchEmployerProfile,
  upsertEmployerProfile,
  JobListing,
  JobApplication,
} from '@/lib/services/jobs-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useJobEmployer() {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [myListings, myProfile] = await Promise.all([
        fetchJobListings({ status: undefined }),
        fetchEmployerProfile(userId),
      ]);
      setListings(myListings.filter((l: JobListing) => l.employer_id === userId));
      setProfile(myProfile);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadApplicants = useCallback(async (listingId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchJobApplications({ listingId });
      setApplicants(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decideApplicant = useCallback(async (appId: string, status: JobApplication['status']) => {
    const updated = await updateJobApplicationStatus(appId, status);
    setApplicants((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    return updated;
  }, []);

  const saveProfile = useCallback(async (payload: any) => {
    if (!userId) throw new Error('Not authenticated');
    const updated = await upsertEmployerProfile({ ...payload, user_id: userId });
    setProfile(updated);
    return updated;
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return {
    listings, applicants, profile, isLoading, error,
    refresh: load, loadApplicants, decideApplicant, saveProfile,
  };
}
