import { useState, useEffect, useCallback } from 'react';
import { teacherIdentityService } from '../services/teacherIdentityService';
import { EducationTeacherIdentity } from '../types/education.types';
import { useAuth } from '@/hooks/useAuth';

type IdentityState = {
  identity: EducationTeacherIdentity | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
};

export function useTeacherIdentity(teacherId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<IdentityState>({
    identity: null,
    loading: true,
    error: null,
    refreshing: false,
  });

  const fetchIdentity = useCallback(async () => {
    if (!teacherId) {
      setState(s => ({ ...s, loading: false, error: 'No teacher ID provided' }));
      return;
    }

    try {
      setState(s => ({ ...s, loading: !s.identity, error: null }));
      const data = await teacherIdentityService.getByTeacherId(teacherId);
      setState(s => ({ ...s, identity: data, loading: false, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'Failed to load teacher identity', loading: false }));
    }
  }, [teacherId]);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    await fetchIdentity();
    setState(s => ({ ...s, refreshing: false }));
  }, [fetchIdentity]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const generateQR = useCallback(async () => {
    if (!state.identity?.teacher_id || !state.identity?.institution_id) {
      throw new Error('Missing teacher or institution ID');
    }
    return teacherIdentityService.generateQR(
      state.identity.teacher_id,
      state.identity.institution_id
    );
  }, [state.identity]);

  const recordCheckIn = useCallback(async (location?: { lat: number; lng: number }) => {
    if (!teacherId) return;
    await teacherIdentityService.recordCheckInOut(teacherId, 'check_in', location);
    await refresh();
  }, [teacherId, refresh]);

  const recordCheckOut = useCallback(async (location?: { lat: number; lng: number }) => {
    if (!teacherId) return;
    await teacherIdentityService.recordCheckInOut(teacherId, 'check_out', location);
    await refresh();
  }, [teacherId, refresh]);

  const addPublication = useCallback(async (publication: { title: string; journal: string; year: number; url?: string }) => {
    if (!teacherId) return;
    await teacherIdentityService.addPublication(teacherId, publication);
    await refresh();
  }, [teacherId, refresh]);

  const addAward = useCallback(async (award: { title: string; issuer: string; year: number; description?: string }) => {
    if (!teacherId) return;
    await teacherIdentityService.addAward(teacherId, award);
    await refresh();
  }, [teacherId, refresh]);

  return {
    ...state,
    refresh,
    generateQR,
    recordCheckIn,
    recordCheckOut,
    addPublication,
    addAward,
    isOwner: state.identity?.teacher?.user_id === user?.id,
    isAdmin: state.identity?.teacher?.institution?.head_teacher_id === user?.id,
  };
}

export function useInstitutionTeachers(institutionId?: string, options?: {
  search?: string;
  accessLevel?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const [state, setState] = useState<{
    identities: EducationTeacherIdentity[];
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
      const result = await teacherIdentityService.getByInstitution(institutionId, options);
      setState(s => ({ ...s, identities: result.data, count: result.count, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [institutionId, options?.search, options?.accessLevel, options?.status, options?.limit, options?.offset]);

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
