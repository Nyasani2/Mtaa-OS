import { useState, useEffect, useCallback } from 'react';
import { studentIdentityService } from '../services/studentIdentityService';
import { EducationStudentIdentity } from '../types/education.types';
import { useAuth } from '@/hooks/useAuth';

type IdentityState = {
  identity: EducationStudentIdentity | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
};

export function useStudentIdentity(studentId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<IdentityState>({
    identity: null,
    loading: true,
    error: null,
    refreshing: false,
  });

  const fetchIdentity = useCallback(async () => {
    if (!studentId) {
      setState(s => ({ ...s, loading: false, error: 'No student ID provided' }));
      return;
    }

    try {
      setState(s => ({ ...s, loading: !s.identity, error: null }));
      const data = await studentIdentityService.getByStudentId(studentId);
      setState(s => ({ ...s, identity: data, loading: false, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'Failed to load identity', loading: false }));
    }
  }, [studentId]);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    await fetchIdentity();
    setState(s => ({ ...s, refreshing: false }));
  }, [fetchIdentity]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const generateQR = useCallback(async () => {
    if (!state.identity?.student_id || !state.identity?.institution_id) {
      throw new Error('Missing student or institution ID');
    }
    return studentIdentityService.generateQR(
      state.identity.student_id,
      state.identity.institution_id
    );
  }, [state.identity]);

  const updateSafetyStatus = useCallback(async (status: string, location?: { lat: number; lng: number }) => {
    if (!studentId) return;
    await studentIdentityService.updateSafetyStatus(studentId, status, location);
    await refresh();
  }, [studentId, refresh]);

  const addEntryExitLog = useCallback(async (gate: string, direction: 'in' | 'out', method: string) => {
    if (!studentId) return;
    await studentIdentityService.addEntryExitLog(studentId, { gate, direction, method });
    await refresh();
  }, [studentId, refresh]);

  return {
    ...state,
    refresh,
    generateQR,
    updateSafetyStatus,
    addEntryExitLog,
    isOwner: state.identity?.student?.user_id === user?.id,
    isGuardian: state.identity?.primary_guardian_id === user?.id || state.identity?.secondary_guardian_id === user?.id,
  };
}

export function useGuardianChildren() {
  const { user } = useAuth();
  const [state, setState] = useState<{
    children: EducationStudentIdentity[];
    loading: boolean;
    error: string | null;
  }>({ children: [], loading: true, error: null });

  useEffect(() => {
    if (!user?.id) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    studentIdentityService.getGuardianChildren(user.id)
      .then(data => setState({ children: data, loading: false, error: null }))
      .catch(err => setState({ children: [], loading: false, error: err.message }));
  }, [user?.id]);

  return state;
}

export function useInstitutionIdentities(institutionId?: string, options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const [state, setState] = useState<{
    identities: EducationStudentIdentity[];
    count: number;
    loading: boolean;
    error: string | null;
    refreshing: boolean;
  }>({ identities: [], count: 0, loading: true, error: null, refreshing: false });

  const fetch = useCallback(async () => {
    if (!institutionId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, loading: !s.identities.length, error: null }));
      const result = await studentIdentityService.getByInstitution(institutionId, options);
      setState(s => ({ ...s, identities: result.data, count: result.count, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [institutionId, options?.search, options?.status, options?.limit, options?.offset]);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    await fetch();
    setState(s => ({ ...s, refreshing: false }));
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refresh };
}
