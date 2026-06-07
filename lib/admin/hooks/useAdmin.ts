// lib/admin/hooks/useAdmin.ts — Admin panel hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  kyc_status: string | null;
  is_verified: boolean;
  created_at: string;
  last_active_at: string | null;
  country: string | null;
  city: string | null;
  id_number?: string | null;
  id_type?: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
}

export interface KycUser {
  id: string;
  email: string;
  full_name: string | null;
  kyc_status: string | null;
  id_number: string | null;
  id_type: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  created_at: string;
  role?: string;
  is_verified?: boolean;
  last_active_at?: string | null;
  country?: string | null;
  city?: string | null;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalTransactions: number;
  totalVolume: number;
}

export function useAdmin() {
  const [adminUser, setAdminUserState] = useState<AdminUser | null>(null);
  const [kycList, setKycListState] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeAdminUser = (raw: any): AdminUser => ({
    id: raw.id || '',
    email: raw.email || '',
    role: raw.role || 'user',
    full_name: raw.full_name || null,
    avatar_url: raw.avatar_url || null,
    kyc_status: raw.kyc_status || null,
    is_verified: raw.is_verified ?? false,
    created_at: raw.created_at || new Date().toISOString(),
    last_active_at: raw.last_active_at || null,
    country: raw.country || null,
    city: raw.city || null,
    id_number: raw.id_number || null,
    id_type: raw.id_type || null,
    id_front_url: raw.id_front_url || null,
    id_back_url: raw.id_back_url || null,
  });

  const setAdminUser = useCallback((raw: any) => {
    setAdminUserState(normalizeAdminUser(raw));
  }, []);

  const setKycList = useCallback((rawList: any[]) => {
    setKycListState(rawList.map(normalizeAdminUser));
  }, []);

  const loadAdminProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) setAdminUser(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setAdminUser]);

  const loadKycList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, kyc_status, id_number, id_type, id_front_url, id_back_url, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setKycList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setKycList]);

  const loadStats = useCallback(async () => {
    try {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true);
      const { count: pendingKyc } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending');

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingKyc: pendingKyc || 0,
        totalTransactions: 0,
        totalVolume: 0,
      });
    } catch (err: any) {
      console.warn('[useAdmin] loadStats failed:', err.message);
    }
  }, []);

  return {
    adminUser,
    kycList,
    stats,
    loading,
    error,
    setAdminUser,
    setKycList,
    loadAdminProfile,
    loadKycList,
    loadStats,
  };
}

export default useAdmin;
