// mstudio-service.ts — MTAA MStudio Service Layer
import { supabase } from '@/lib/supabase';
import type {
  MStudioStudio, MStudioVideo, MStudioLiveStream, MStudioLiveChatMessage,
  MStudioSuperChat, MStudioProject, MStudioProjectScene, MStudioComment,
  MStudioSubscription, MStudioWatchHistory, MStudioPlaylist, MStudioRevenue,
  MStudioAnalyticsDaily, MStudioThumbnail, MStudioMusicTrack, MStudioDraft,
  MStudioPairingSession, MStudioPairedDevice, MStudioSceneDetection,
  MStudioRecording, MStudioNotification, MStudioCommunityPost,
  MStudioMembershipTier, MStudioMerch, MStudioTip, MStudioASISContent,
  MStudioFeedFilters, MStudioSearchResult, MStudioDashboardStats,
  MStudioRevenueSummary, MStudioAnalyticsPoint,
} from './mstudio-types';

const TIMEOUT = 15000;
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error(`${label} timeout`)), ms))]);
}

// ─── STUDIOS ───
export async function getStudios(limit = 20): Promise<MStudioStudio[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_studios').select('*').order('subscriber_count', { ascending: false }).limit(limit),
    TIMEOUT, 'getStudios'
  );
  if (error) throw error;
  return (data || []) as MStudioStudio[];
}

export async function getStudioById(id: string): Promise<MStudioStudio | null> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_studios').select('*').eq('id', id).single(), TIMEOUT, 'getStudioById'
  );
  if (error) return null;
  return data as MStudioStudio;
}

export async function getStudioByHandle(handle: string): Promise<MStudioStudio | null> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_studios').select('*').eq('handle', handle).single(), TIMEOUT, 'getStudioByHandle'
  );
  if (error) return null;
  return data as MStudioStudio;
}

export async function createStudio(studio: Partial<MStudioStudio>): Promise<MStudioStudio> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_studios').insert(studio).select().single(), TIMEOUT, 'createStudio'
  );
  if (error) throw error;
  return data as MStudioStudio;
}

export async function updateStudio(id: string, updates: Partial<MStudioStudio>): Promise<MStudioStudio> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_studios').update(updates).eq('id', id).select().single(), TIMEOUT, 'updateStudio'
  );
  if (error) throw error;
  return data as MStudioStudio;
}

// ─── VIDEOS ───
export async function getVideos(filters?: MStudioFeedFilters): Promise<MStudioVideo[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_feed', {
      p_limit: filters?.limit || 20, p_offset: filters?.offset || 0,
      p_category: filters?.category || null, p_content_type: filters?.content_type || null,
    }), TIMEOUT, 'getVideos'
  );
  if (error) throw error;
  return (data || []) as MStudioVideo[];
}

export async function getVideoById(id: string): Promise<any> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_video_details', { p_video_id: id }), TIMEOUT, 'getVideoById'
  );
  if (error) throw error;
  return data;
}

export async function createVideo(video: Partial<MStudioVideo>): Promise<MStudioVideo> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_videos').insert(video).select().single(), TIMEOUT, 'createVideo'
  );
  if (error) throw error;
  return data as MStudioVideo;
}

export async function updateVideo(id: string, updates: Partial<MStudioVideo>): Promise<MStudioVideo> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_videos').update(updates).eq('id', id).select().single(), TIMEOUT, 'updateVideo'
  );
  if (error) throw error;
  return data as MStudioVideo;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('mstudio_videos').delete().eq('id', id), TIMEOUT, 'deleteVideo'
  );
  if (error) throw error;
}

export async function incrementVideoView(id: string): Promise<void> {
  await withTimeout(supabase.rpc('mstudio_increment_view', { p_video_id: id }), TIMEOUT, 'incrementView');
}

// ─── LIVE STREAMS ───
export async function getLiveStreams(status?: string): Promise<MStudioLiveStream[]> {
  let q = supabase.from('mstudio_live_streams').select('*');
  if (status) q = q.eq('status', status);
  const { data, error } = await withTimeout(q.order('created_at', { ascending: false }), TIMEOUT, 'getLiveStreams');
  if (error) throw error;
  return (data || []) as MStudioLiveStream[];
}

export async function getLiveStreamById(id: string): Promise<any> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_live_stream', { p_stream_id: id }), TIMEOUT, 'getLiveStreamById'
  );
  if (error) throw error;
  return data;
}

export async function createLiveStream(stream: Partial<MStudioLiveStream>): Promise<MStudioLiveStream> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_live_streams').insert(stream).select().single(), TIMEOUT, 'createLiveStream'
  );
  if (error) throw error;
  return data as MStudioLiveStream;
}

export async function updateLiveStream(id: string, updates: Partial<MStudioLiveStream>): Promise<MStudioLiveStream> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_live_streams').update(updates).eq('id', id).select().single(), TIMEOUT, 'updateLiveStream'
  );
  if (error) throw error;
  return data as MStudioLiveStream;
}

// ─── LIVE CHAT ───
export async function getLiveChatMessages(streamId: string, limit = 100): Promise<MStudioLiveChatMessage[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_live_chat').select('*, user_profiles(full_name, avatar_url)')
      .eq('stream_id', streamId).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(limit),
    TIMEOUT, 'getLiveChat'
  );
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, full_name: d.user_profiles?.full_name, avatar_url: d.user_profiles?.avatar_url })) as MStudioLiveChatMessage[];
}

export async function sendLiveChatMessage(msg: Partial<MStudioLiveChatMessage>): Promise<MStudioLiveChatMessage> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_live_chat').insert(msg).select().single(), TIMEOUT, 'sendChat'
  );
  if (error) throw error;
  return data as MStudioLiveChatMessage;
}

export async function sendSuperChat(streamId: string, senderId: string, amount: number, message?: string): Promise<string> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_send_super_chat', {
      p_stream_id: streamId, p_sender_id: senderId,
      p_amount: amount, p_currency: 'KES', p_message: message || null,
    }), TIMEOUT, 'sendSuperChat'
  );
  if (error) throw error;
  return data as string;
}

// ─── PROJECTS ───
export async function getProjects(userId: string): Promise<MStudioProject[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    TIMEOUT, 'getProjects'
  );
  if (error) throw error;
  return (data || []) as MStudioProject[];
}

export async function getProjectById(id: string): Promise<any> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_project', { p_project_id: id }), TIMEOUT, 'getProjectById'
  );
  if (error) throw error;
  return data;
}

export async function createProject(project: Partial<MStudioProject>): Promise<MStudioProject> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_projects').insert(project).select().single(), TIMEOUT, 'createProject'
  );
  if (error) throw error;
  return data as MStudioProject;
}

export async function updateProject(id: string, updates: Partial<MStudioProject>): Promise<MStudioProject> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_projects').update(updates).eq('id', id).select().single(), TIMEOUT, 'updateProject'
  );
  if (error) throw error;
  return data as MStudioProject;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('mstudio_projects').delete().eq('id', id), TIMEOUT, 'deleteProject'
  );
  if (error) throw error;
}

// ─── COMMENTS ───
export async function getComments(videoId: string, parentId?: string): Promise<MStudioComment[]> {
  let q = supabase.from('mstudio_comments').select('*, user_profiles(full_name, avatar_url)')
    .eq('video_id', videoId).eq('is_deleted', false);
  if (parentId) q = q.eq('parent_id', parentId); else q = q.is('parent_id', null);
  const { data, error } = await withTimeout(
    q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
    TIMEOUT, 'getComments'
  );
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, full_name: d.user_profiles?.full_name, avatar_url: d.user_profiles?.avatar_url })) as MStudioComment[];
}

export async function createComment(comment: Partial<MStudioComment>): Promise<MStudioComment> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_comments').insert(comment).select().single(), TIMEOUT, 'createComment'
  );
  if (error) throw error;
  return data as MStudioComment;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('mstudio_comments').update({ is_deleted: true }).eq('id', id), TIMEOUT, 'deleteComment'
  );
  if (error) throw error;
}

// ─── SUBSCRIPTIONS ───
export async function subscribeToStudio(studioId: string, subscriberId: string, tier = 'free'): Promise<MStudioSubscription> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_subscriptions').insert({ studio_id: studioId, subscriber_id: subscriberId, tier }).select().single(),
    TIMEOUT, 'subscribe'
  );
  if (error) throw error;
  return data as MStudioSubscription;
}

export async function unsubscribeFromStudio(studioId: string, subscriberId: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('mstudio_subscriptions').delete().eq('studio_id', studioId).eq('subscriber_id', subscriberId),
    TIMEOUT, 'unsubscribe'
  );
  if (error) throw error;
}

// ─── WATCH HISTORY ───
export async function getWatchHistory(userId: string, limit = 50): Promise<any[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_watch_history', { p_user_id: userId, p_limit: limit }), TIMEOUT, 'getWatchHistory'
  );
  if (error) throw error;
  return data || [];
}

export async function saveWatchProgress(userId: string, videoId: string, watchDuration: number, totalDuration: number): Promise<void> {
  const progress = totalDuration > 0 ? Math.round((watchDuration / totalDuration) * 100) : 0;
  const { error } = await withTimeout(
    supabase.from('mstudio_watch_history').upsert({
      user_id: userId, video_id: videoId, watch_duration: watchDuration,
      total_duration: totalDuration, progress_percent: progress, is_completed: progress >= 90,
    }), TIMEOUT, 'saveWatchProgress'
  );
  if (error) throw error;
}

// ─── PLAYLISTS ───
export async function getPlaylists(studioId: string): Promise<MStudioPlaylist[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_playlists').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }),
    TIMEOUT, 'getPlaylists'
  );
  if (error) throw error;
  return (data || []) as MStudioPlaylist[];
}

export async function createPlaylist(playlist: Partial<MStudioPlaylist>): Promise<MStudioPlaylist> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_playlists').insert(playlist).select().single(), TIMEOUT, 'createPlaylist'
  );
  if (error) throw error;
  return data as MStudioPlaylist;
}

// ─── REVENUE ───
export async function getRevenueSummary(studioId: string, startDate?: string, endDate?: string): Promise<MStudioRevenueSummary> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_revenue_summary', {
      p_studio_id: studioId, p_start_date: startDate || null, p_end_date: endDate || null,
    }), TIMEOUT, 'getRevenueSummary'
  );
  if (error) throw error;
  return data as MStudioRevenueSummary;
}

// ─── ANALYTICS ───
export async function getAnalyticsTimeseries(studioId: string, videoId?: string, days = 30): Promise<MStudioAnalyticsPoint[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_analytics_timeseries', {
      p_studio_id: studioId, p_video_id: videoId || null, p_days: days,
    }), TIMEOUT, 'getAnalytics'
  );
  if (error) throw error;
  return (data || []) as MStudioAnalyticsPoint[];
}

// ─── SEARCH ───
export async function searchMStudio(query: string, limit = 20): Promise<MStudioSearchResult> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_search', { p_query: query, p_limit: limit }), TIMEOUT, 'search'
  );
  if (error) throw error;
  return (data || { videos: [], studios: [] }) as MStudioSearchResult;
}

// ─── DASHBOARD ───
export async function getStudioDashboard(studioId: string): Promise<MStudioDashboardStats> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_studio_dashboard', { p_studio_id: studioId }), TIMEOUT, 'getDashboard'
  );
  if (error) throw error;
  return data as MStudioDashboardStats;
}

// ─── NOTIFICATIONS ───
export async function getNotifications(userId: string, limit = 50): Promise<MStudioNotification[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_notifications', { p_user_id: userId, p_limit: limit }), TIMEOUT, 'getNotifications'
  );
  if (error) throw error;
  return (data || []) as MStudioNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await withTimeout(supabase.rpc('mstudio_mark_notification_read', { p_notification_id: id }), TIMEOUT, 'markRead');
}

// ─── PAIRING ───
export async function createPairingSession(directorId: string, title?: string): Promise<MStudioPairingSession> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data, error } = await withTimeout(
    supabase.from('mstudio_pairing_sessions').insert({
      director_id: directorId, session_code: code, title: title || 'Multi-Cam Session', status: 'active',
    }).select().single(), TIMEOUT, 'createPairing'
  );
  if (error) throw error;
  return data as MStudioPairingSession;
}

export async function getPairedDevices(sessionCode: string): Promise<any> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_paired_devices', { p_session_code: sessionCode }), TIMEOUT, 'getPairedDevices'
  );
  if (error) throw error;
  return data;
}

export async function joinPairingSession(sessionCode: string, deviceId: string, deviceName: string, role = 'camera'): Promise<MStudioPairedDevice> {
  const { data: sess } = await withTimeout(
    supabase.from('mstudio_pairing_sessions').select('id').eq('session_code', sessionCode).eq('status', 'active').single(),
    TIMEOUT, 'findSession'
  );
  if (!sess) throw new Error('Session not found');
  const { data, error } = await withTimeout(
    supabase.from('mstudio_paired_devices').insert({
      session_id: sess.id, device_id: deviceId, device_name: deviceName, device_role: role,
    }).select().single(), TIMEOUT, 'joinPairing'
  );
  if (error) throw error;
  return data as MStudioPairedDevice;
}

// ─── DRAFTS ───
export async function getDrafts(userId: string): Promise<MStudioDraft[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_drafts', { p_user_id: userId }), TIMEOUT, 'getDrafts'
  );
  if (error) throw error;
  return (data || []) as MStudioDraft[];
}

export async function createDraft(draft: Partial<MStudioDraft>): Promise<MStudioDraft> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_drafts').insert(draft).select().single(), TIMEOUT, 'createDraft'
  );
  if (error) throw error;
  return data as MStudioDraft;
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('mstudio_drafts').delete().eq('id', id), TIMEOUT, 'deleteDraft'
  );
  if (error) throw error;
}

// ─── RECORDINGS ───
export async function getRecordings(userId: string): Promise<MStudioRecording[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_recordings', { p_user_id: userId }), TIMEOUT, 'getRecordings'
  );
  if (error) throw error;
  return (data || []) as MStudioRecording[];
}

export async function createRecording(rec: Partial<MStudioRecording>): Promise<MStudioRecording> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_recordings').insert(rec).select().single(), TIMEOUT, 'createRecording'
  );
  if (error) throw error;
  return data as MStudioRecording;
}

// ─── COMMUNITY ───
export async function getCommunityPosts(studioId: string, limit = 20): Promise<MStudioCommunityPost[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_community_posts', { p_studio_id: studioId, p_limit: limit }), TIMEOUT, 'getCommunity'
  );
  if (error) throw error;
  return (data || []) as MStudioCommunityPost[];
}

export async function createCommunityPost(post: Partial<MStudioCommunityPost>): Promise<MStudioCommunityPost> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_community_posts').insert(post).select().single(), TIMEOUT, 'createCommunityPost'
  );
  if (error) throw error;
  return data as MStudioCommunityPost;
}

// ─── MEMBERSHIPS ───
export async function getMembershipTiers(studioId: string): Promise<MStudioMembershipTier[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_membership_tiers', { p_studio_id: studioId }), TIMEOUT, 'getTiers'
  );
  if (error) throw error;
  return (data || []) as MStudioMembershipTier[];
}

// ─── MERCH ───
export async function getMerch(studioId: string): Promise<MStudioMerch[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_merch', { p_studio_id: studioId }), TIMEOUT, 'getMerch'
  );
  if (error) throw error;
  return (data || []) as MStudioMerch[];
}

// ─── TIPS ───
export async function getTips(studioId: string, limit = 50): Promise<MStudioTip[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_tips', { p_studio_id: studioId, p_limit: limit }), TIMEOUT, 'getTips'
  );
  if (error) throw error;
  return (data || []) as MStudioTip[];
}

export async function sendTip(studioId: string, senderId: string, receiverId: string, amount: number, message?: string): Promise<MStudioTip> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_tips').insert({
      studio_id: studioId, sender_id: senderId, receiver_id: receiverId,
      amount, currency: 'KES', message,
    }).select().single(), TIMEOUT, 'sendTip'
  );
  if (error) throw error;
  return data as MStudioTip;
}

// ─── ASIS ───
export async function getASISContent(userId: string, limit = 20): Promise<MStudioASISContent[]> {
  const { data, error } = await withTimeout(
    supabase.rpc('mstudio_get_asis_content', { p_user_id: userId, p_limit: limit }), TIMEOUT, 'getASIS'
  );
  if (error) throw error;
  return (data || []) as MStudioASISContent[];
}

export async function createASISContent(content: Partial<MStudioASISContent>): Promise<MStudioASISContent> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_asis_content').insert(content).select().single(), TIMEOUT, 'createASIS'
  );
  if (error) throw error;
  return data as MStudioASISContent;
}

// ─── MUSIC ───
export async function getMusicTracks(userId: string): Promise<MStudioMusicTrack[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_music_tracks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    TIMEOUT, 'getMusic'
  );
  if (error) throw error;
  return (data || []) as MStudioMusicTrack[];
}

// ─── THUMBNAILS ───
export async function getThumbnails(videoId: string): Promise<MStudioThumbnail[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_thumbnails').select('*').eq('video_id', videoId).order('created_at', { ascending: false }),
    TIMEOUT, 'getThumbnails'
  );
  if (error) throw error;
  return (data || []) as MStudioThumbnail[];
}

export async function createThumbnail(thumb: Partial<MStudioThumbnail>): Promise<MStudioThumbnail> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_thumbnails').insert(thumb).select().single(), TIMEOUT, 'createThumbnail'
  );
  if (error) throw error;
  return data as MStudioThumbnail;
}

// ─── SCENE DETECTION ───
export async function getSceneDetections(videoId: string): Promise<MStudioSceneDetection[]> {
  const { data, error } = await withTimeout(
    supabase.from('mstudio_scene_detections').select('*').eq('video_id', videoId).order('scene_start'),
    TIMEOUT, 'getScenes'
  );
  if (error) throw error;
  return (data || []) as MStudioSceneDetection[];
}

// ─── REALTIME ───
export function subscribeToLiveChat(streamId: string, cb: (payload: any) => void) {
  return supabase.channel(`live_chat:${streamId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mstudio_live_chat', filter: `stream_id=eq.${streamId}` }, cb)
    .subscribe();
}

export function subscribeToNotifications(userId: string, cb: (payload: any) => void) {
  return supabase.channel(`notif:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mstudio_notifications', filter: `user_id=eq.${userId}` }, cb)
    .subscribe();
}

export function subscribeToStudioUpdates(studioId: string, cb: (payload: any) => void) {
  return supabase.channel(`studio:${studioId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mstudio_studios', filter: `id=eq.${studioId}` }, cb)
    .subscribe();
}

export function subscribeToVideoUpdates(videoId: string, cb: (payload: any) => void) {
  return supabase.channel(`video:${videoId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mstudio_videos', filter: `id=eq.${videoId}` }, cb)
    .subscribe();
}
