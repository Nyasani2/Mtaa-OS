// lib/services/home-service.ts
// FIXED: Added missing supabase import

import { supabase } from '@/lib/supabase';
import { ServiceResult, handleServiceError } from '@/lib/utils/service-helpers';

export async function getHomeFeed(userId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('streets_posts').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getHomeWidgets(userId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('home_widgets').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function updateWidgetOrder(userId: string, widgetIds: string[]): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('home_widgets').upsert(widgetIds.map((id, i) => ({ id, user_id: userId, order_index: i })));
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getRecommendedApps(userId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('appstore_apps').select('*').limit(10);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getQuickActions(userId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('quick_actions').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getNotificationsPreview(userId: string): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}
