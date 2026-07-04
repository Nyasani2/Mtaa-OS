// lib/services/tribes-service.ts
// FIXED: Added missing supabase import

import { supabase } from '@/lib/supabase/client';
import { ServiceResult, handleServiceError } from '@/lib/utils/service-helpers';

export async function getTribes(limit = 50): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('tribes').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getTribeById(tribeId: string): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('tribes').select('*').eq('id', tribeId).single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getTribeMembers(tribeId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('tribe_members').select('*').eq('tribe_id', tribeId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getTribePosts(tribeId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('tribe_posts').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function createTribe(payload: any): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('tribes').insert(payload).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function joinTribe(tribeId: string, userId: string): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('tribe_members').insert({ tribe_id: tribeId, user_id: userId }).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}
