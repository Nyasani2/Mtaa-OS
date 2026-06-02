// lib/streets/services/adsService.ts
// MTAA Streets — Ads Service (wired to streets_ads table)

import { supabase } from '@/lib/supabase';
import { StreetAd } from '../types';

export async function fetchAds(userId: string): Promise<StreetAd[]> {
  const { data, error } = await supabase
    .from('streets_ads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StreetAd[];
}

export async function createAd(
  userId: string,
  ad: Omit<StreetAd, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent' | 'impressions' | 'clicks'>
): Promise<StreetAd> {
  const { data, error } = await supabase
    .from('streets_ads')
    .insert({
      ...ad,
      user_id: userId,
      spent: 0,
      impressions: 0,
      clicks: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as StreetAd;
}

export async function updateAd(
  adId: string,
  userId: string,
  updates: Partial<Omit<StreetAd, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('streets_ads')
    .update(updates)
    .eq('id', adId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateAdStatus(
  adId: string,
  userId: string,
  status: 'draft' | 'active' | 'paused' | 'completed'
): Promise<void> {
  const { error } = await supabase
    .from('streets_ads')
    .update({ status })
    .eq('id', adId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAd(adId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_ads')
    .delete()
    .eq('id', adId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchActiveAdsForFeed(limit: number = 5): Promise<StreetAd[]> {
  const { data, error } = await supabase
    .from('streets_ads')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .limit(limit);

  if (error) throw error;
  return (data || []) as StreetAd[];
}

export async function recordAdImpression(adId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_ad_impression', { ad_id: adId });
  if (error) throw error;
}

export async function recordAdClick(adId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_ad_click', { ad_id: adId });
  if (error) throw error;
}
