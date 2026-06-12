import { useState, useEffect, useCallback } from 'react';
import { qrSessionService } from '../services/qrSessionService';
import { EducationQRSession, EducationQRScan } from '../types/education.types';
import { useAuth } from '@/hooks/useAuth';

type QRState = {
  sessions: EducationQRSession[];
  loading: boolean;
  error: string | null;
  generating: boolean;
  scanning: boolean;
};

export function useQRSession() {
  const { user } = useAuth();
  const [state, setState] = useState<QRState>({
    sessions: [],
    loading: true,
    error: null,
    generating: false,
    scanning: false,
  });

  const fetchSessions = useCallback(async () => {
    if (!user?.id) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, loading: !s.sessions.length, error: null }));
      const result = await qrSessionService.getByGenerator(user.id, { limit: 50 });
      setState(s => ({ ...s, sessions: result.data, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const generateQR = useCallback(async (payload: {
    qr_type: string;
    target_id?: string;
    target_type?: string;
    institution_id?: string;
    class_id?: string;
    valid_minutes?: number;
    max_scans?: number;
  }): Promise<EducationQRSession> => {
    if (!user?.id) throw new Error('Not authenticated');

    setState(s => ({ ...s, generating: true, error: null }));
    try {
      const session = await qrSessionService.generateQR({
        ...payload,
        generated_by: user.id,
        generated_by_role: user.user_metadata?.role || 'student',
      });
      setState(s => ({ ...s, sessions: [session, ...s.sessions], generating: false }));
      return session;
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, generating: false }));
      throw err;
    }
  }, [user?.id, user?.user_metadata?.role]);

  const scanQR = useCallback(async (sessionId: string, location?: { lat: number; lng: number }): Promise<{ valid: boolean; reason: string }> => {
    if (!user?.id) throw new Error('Not authenticated');

    setState(s => ({ ...s, scanning: true, error: null }));
    try {
      const result = await qrSessionService.scanQR({
        session_id: sessionId,
        scanned_by: user.id,
        scanned_by_role: user.user_metadata?.role || 'teacher',
        location,
      });
      setState(s => ({ ...s, scanning: false }));
      return result;
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, scanning: false }));
      throw err;
    }
  }, [user?.id, user?.user_metadata?.role]);

  const revokeSession = useCallback(async (sessionId: string) => {
    await qrSessionService.revokeSession(sessionId);
    setState(s => ({
      ...s,
      sessions: s.sessions.map(sess => sess.id === sessionId ? { ...sess, status: 'revoked' } : sess),
    }));
  }, []);

  return {
    ...state,
    refresh: fetchSessions,
    generateQR,
    scanQR,
    revokeSession,
  };
}

export function useScanHistory(sessionId?: string) {
  const [state, setState] = useState<{
    scans: EducationQRScan[];
    loading: boolean;
    error: string | null;
  }>({ scans: [], loading: true, error: null });

  const fetch = useCallback(async () => {
    if (!sessionId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, loading: !s.scans.length, error: null }));
      const data = await qrSessionService.getScanHistory(sessionId);
      setState(s => ({ ...s, scans: data, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [sessionId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refresh: fetch };
}
