import { useState, useCallback, useEffect } from 'react';
import {
  getConnections, createConnection, verifyConnection, revokeConnection,
  getNotifications, markAsRead, markAllAsRead, getUnreadCount,
  getFeedback, createFeedback, respondToFeedback, getParentDashboard,
  type ParentConnection, type ParentNotification, type ParentFeedback, type CreateConnectionInput, type CreateFeedbackInput,
} from '@/domains/education/services/parentPortalService';

// ============================================
// useParentConnections — Manage guardian-student links
// ============================================
export function useParentConnections(guardianId?: string) {
  const [connections, setConnections] = useState<ParentConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetch = useCallback(async () => {
    if (!guardianId) return;
    setLoading(true); setError('');
    const { data, error } = await getConnections(guardianId);
    if (data) setConnections(data);
    if (error) setError(error);
    setLoading(false);
  }, [guardianId]);

  const add = useCallback(async (input: CreateConnectionInput) => {
    setCreating(true); setError('');
    const { data, error } = await createConnection(input);
    if (data) setConnections(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const verify = useCallback(async (id: string, method: string) => {
    setLoading(true); setError('');
    const { success, error } = await verifyConnection(id, method);
    if (success) setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'verified' as const, verified_at: new Date().toISOString() } : c));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  const revoke = useCallback(async (id: string) => {
    setLoading(true); setError('');
    const { success, error } = await revokeConnection(id);
    if (success) setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' as const } : c));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { connections, loading, error, creating, fetch, add, verify, revoke };
}

// ============================================
// useParentNotifications — Guardian notification inbox
// ============================================
export function useParentNotifications(guardianId?: string) {
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!guardianId) return;
    setLoading(true); setError('');
    const [{ data, error: nErr }, { count, error: cErr }] = await Promise.all([
      getNotifications(guardianId),
      getUnreadCount(guardianId),
    ]);
    if (data) setNotifications(data);
    if (count !== undefined) setUnreadCount(count);
    setError(nErr || cErr);
    setLoading(false);
  }, [guardianId]);

  const readOne = useCallback(async (id: string) => {
    const { success, error } = await markAsRead(id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (error) setError(error);
    return { success, error };
  }, []);

  const readAll = useCallback(async () => {
    if (!guardianId) return;
    const { success, error } = await markAllAsRead(guardianId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    }
    if (error) setError(error);
    return { success, error };
  }, [guardianId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { notifications, unreadCount, loading, error, fetch, readOne, readAll };
}

// ============================================
// useParentFeedback — Guardian-teacher communication
// ============================================
export function useParentFeedback(guardianId?: string) {
  const [feedback, setFeedback] = useState<ParentFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetch = useCallback(async () => {
    if (!guardianId) return;
    setLoading(true); setError('');
    const { data, error } = await getFeedback({ guardian_id: guardianId });
    if (data) setFeedback(data);
    if (error) setError(error);
    setLoading(false);
  }, [guardianId]);

  const add = useCallback(async (input: CreateFeedbackInput) => {
    setCreating(true); setError('');
    const { data, error } = await createFeedback(input);
    if (data) setFeedback(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { feedback, loading, error, creating, fetch, add };
}

// ============================================
// useParentDashboard — Combined parent overview
// ============================================
export function useParentDashboard(guardianId?: string) {
  const [dashboard, setDashboard] = useState<{
    children: ParentConnection[];
    unread_count: number;
    recent_notifications: ParentNotification[];
    open_feedback: ParentFeedback[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!guardianId) return;
    setLoading(true); setError('');
    const { data, error } = await getParentDashboard(guardianId);
    if (data) setDashboard(data);
    if (error) setError(error);
    setLoading(false);
  }, [guardianId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboard, loading, error, refresh: fetch };
}
