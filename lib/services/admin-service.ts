// lib/services/admin-service.ts
// FIXED: Added missing supabase import

import { supabase } from '@/lib/supabase';
import { ServiceResult, handleServiceError } from '@/lib/utils/service-helpers';

export async function getDashboardStats(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getRecentUsers(limit = 10): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getSystemHealth(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.rpc('get_system_health');
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getAnalyticsSummary(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('analytics_events').select('*').limit(100);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getRevenueStats(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('wallet_transactions').select('amount, status, created_at');
    if (error) throw error;
    const total = (data || []).reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
    return { data: { total, count: (data || []).length }, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getUserGrowth(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('users').select('created_at');
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}

export async function getActiveSessions(): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('active_sessions').select('*');
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err) as any;
  }
}
