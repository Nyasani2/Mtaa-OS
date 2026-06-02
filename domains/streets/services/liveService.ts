// lib/streets/services/liveService.ts
// MTAA Streets — Live Streaming Service (wired to streets_lives table)

import { supabase } from '@/lib/supabase';
import { StreetLive } from '../types';

export async function fetchLives(status?: 'live' | 'ended' | 'scheduled'): Promise<StreetLive[]> {
  let query = supabase
    .from('streets_lives')
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    stream_url: row.stream_url,
    status: row.status,
    viewer_count: row.viewer_count || 0,
    peak_viewers: row.peak_viewers || 0,
    scheduled_at: row.scheduled_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    created_at: row.created_at,
    author: row.author,
  }));
}

export async function createLive(
  userId: string,
  title: string,
  description?: string,
  thumbnailUrl?: string,
  scheduledAt?: string
): Promise<StreetLive> {
  const { data, error } = await supabase
    .from('streets_lives')
    .insert({
      user_id: userId,
      title,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      stream_url: '',
      status: scheduledAt ? 'scheduled' : 'live',
      viewer_count: 0,
      peak_viewers: 0,
      scheduled_at: scheduledAt || null,
      started_at: scheduledAt ? null : new Date().toISOString(),
    })
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    thumbnail_url: data.thumbnail_url,
    stream_url: data.stream_url,
    status: data.status,
    viewer_count: data.viewer_count || 0,
    peak_viewers: data.peak_viewers || 0,
    scheduled_at: data.scheduled_at,
    started_at: data.started_at,
    ended_at: data.ended_at,
    created_at: data.created_at,
    author: data.author,
  };
}

export async function updateLiveStreamUrl(liveId: string, streamUrl: string): Promise<void> {
  const { error } = await supabase
    .from('streets_lives')
    .update({ stream_url: streamUrl })
    .eq('id', liveId);
  if (error) throw error;
}

export async function endLive(liveId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_lives')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', liveId);
  if (error) throw error;
}

export async function incrementViewerCount(liveId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_live_viewers', { live_id: liveId });
  if (error) throw error;
}

export async function decrementViewerCount(liveId: string): Promise<void> {
  const { error } = await supabase.rpc('decrement_live_viewers', { live_id: liveId });
  if (error) throw error;
}
