import { useState, useEffect, useCallback } from 'react';
import { institutionProfileService } from '../services/institutionProfileService';
import {
  EducationInstitutionProfile,
  EducationVerificationLog,
  EducationInstitutionDocument,
} from '../types/education.types';
import { useAuth } from '@/hooks/useAuth';

type ProfileState = {
  profile: EducationInstitutionProfile | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
};

export function useInstitutionProfile(institutionId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
    refreshing: false,
  });

  const fetchProfile = useCallback(async () => {
    if (!institutionId) {
      setState(s => ({ ...s, loading: false, error: 'No institution ID provided' }));
      return;
    }

    try {
      setState(s => ({ ...s, loading: !s.profile, error: null }));
      const data = await institutionProfileService.getProfile(institutionId);
      setState(s => ({ ...s, profile: data, loading: false, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'Failed to load profile', loading: false }));
    }
  }, [institutionId]);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    await fetchProfile();
    setState(s => ({ ...s, refreshing: false }));
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<EducationInstitutionProfile>) => {
    if (!institutionId) return;
    await institutionProfileService.upsertProfile({ institution_id: institutionId, ...updates });
    await refresh();
  }, [institutionId, refresh]);

  return {
    ...state,
    refresh,
    updateProfile,
    isAdmin: state.profile?.institution?.head_teacher_id === user?.id,
    verificationStatus: state.profile?.institution?.verification_status,
  };
}

export function useVerificationWorkflow(institutionId?: string) {
  const [state, setState] = useState<{
    logs: EducationVerificationLog[];
    loading: boolean;
    error: string | null;
    submitting: boolean;
  }>({ logs: [], loading: true, error: null, submitting: false });

  const fetchLogs = useCallback(async () => {
    if (!institutionId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, loading: !s.logs.length, error: null }));
      const data = await institutionProfileService.getVerificationLogs(institutionId);
      setState(s => ({ ...s, logs: data, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [institutionId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const submitStep = useCallback(async (payload: Partial<EducationVerificationLog>) => {
    if (!institutionId) return;
    setState(s => ({ ...s, submitting: true }));
    try {
      await institutionProfileService.submitVerificationStep({ institution_id: institutionId, ...payload });
      await fetchLogs();
    } finally {
      setState(s => ({ ...s, submitting: false }));
    }
  }, [institutionId, fetchLogs]);

  const completeStep = useCallback(async (logId: string, updates: Partial<EducationVerificationLog>) => {
    await institutionProfileService.completeVerificationStep(logId, updates);
    await fetchLogs();
  }, [fetchLogs]);

  const rejectStep = useCallback(async (logId: string, reason: string) => {
    await institutionProfileService.rejectVerification(logId, reason);
    await fetchLogs();
  }, [fetchLogs]);

  const currentStep = state.logs.length > 0
    ? state.logs.reduce((latest, log) => log.step_number > latest.step_number ? log : latest, state.logs[0])
    : null;

  const isComplete = currentStep?.step === 'approved' && currentStep?.status === 'completed';

  return {
    ...state,
    currentStep,
    isComplete,
    submitStep,
    completeStep,
    rejectStep,
    refresh: fetchLogs,
  };
}

export function useInstitutionDocuments(institutionId?: string) {
  const [state, setState] = useState<{
    documents: EducationInstitutionDocument[];
    loading: boolean;
    error: string | null;
  }>({ documents: [], loading: true, error: null });

  const fetch = useCallback(async () => {
    if (!institutionId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, loading: !s.documents.length, error: null }));
      const data = await institutionProfileService.getDocuments(institutionId);
      setState(s => ({ ...s, documents: data, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [institutionId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const uploadDocument = useCallback(async (payload: Partial<EducationInstitutionDocument>) => {
    if (!institutionId) return;
    await institutionProfileService.uploadDocument({ institution_id: institutionId, ...payload });
    await fetch();
  }, [institutionId, fetch]);

  return { ...state, uploadDocument, refresh: fetch };
}
