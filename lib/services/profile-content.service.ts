import { supabase } from '@/lib/supabase/client';
import { Platform } from 'react-native';

export interface UnifiedContentItem {
  id: string;
  sourceTable: string;
  sourceId: string;
  title: string;
  thumbnail: string | null;
  mediaUrl: string | null;
  mediaType: 'video' | 'image' | 'audio' | 'live' | 'post' | 'unknown';
  creatorId: string;
  createdAt: string;
  likes: number;
  views: number;
  comments: number;
  shares: number;
  duration?: number;
  isLive?: boolean;
  debug?: any;
}

const THUMBNAIL_COLUMNS = [
  'thumbnail_url', 'thumbnail', 'thumb_url', 'thumb',
  'cover_url', 'cover', 'poster_url', 'poster',
  'frame_url', 'frame', 'screenshot_url', 'screenshot',
  'preview_url', 'preview', 'image_url', 'image',
  'media_url', 'media', 'video_url', 'video',
  'url', 'file_url', 'file', 'src', 'source',
  'path', 'storage_path', 'banner_url', 'banner',
  'avatar_url', 'avatar', 'picture_url', 'picture',
  'photo_url', 'photo', 'asset_url', 'asset',
];

const TITLE_COLUMNS = [
  'title', 'caption', 'description', 'name',
  'text', 'content', 'body', 'message',
  'headline', 'subject', 'label', 'tagline',
  'summary', 'snippet', 'excerpt',
];

const MEDIA_COLUMNS = [
  'media_url', 'video_url', 'audio_url', 'stream_url',
  'url', 'file_url', 'file', 'src', 'source',
  'path', 'storage_path', 'content_url', 'download_url',
  'playback_url', 'manifest_url', 'hls_url',
];

const COUNT_COLUMNS = [
  'likes_count', 'like_count', 'likes', 'total_likes',
  'views_count', 'view_count', 'views', 'total_views',
  'plays_count', 'play_count', 'plays', 'total_plays',
  'comments_count', 'comment_count', 'comments', 'total_comments',
  'shares_count', 'share_count', 'shares', 'total_shares',
];

function resolveThumbnail(row: any): string | null {
  // 1. Try all known thumbnail columns
  for (const col of THUMBNAIL_COLUMNS) {
    const val = row[col];
    if (val && typeof val === 'string' && val.length > 3) {
      // If it's a storage path (no http), resolve to public URL
      if (!val.startsWith('http')) {
        try {
          const { data } = supabase.storage.from('thumbnails').getPublicUrl(val);
          if (data?.publicUrl) return data.publicUrl;
        } catch {}
        try {
          const { data } = supabase.storage.from('media').getPublicUrl(val);
          if (data?.publicUrl) return data.publicUrl;
        } catch {}
        try {
          const { data } = supabase.storage.from('content').getPublicUrl(val);
          if (data?.publicUrl) return data.publicUrl;
        } catch {}
        try {
          const { data } = supabase.storage.from('public').getPublicUrl(val);
          if (data?.publicUrl) return data.publicUrl;
        } catch {}
      }
      return val;
    }
  }
  return null;
}

function resolveTitle(row: any): string {
  for (const col of TITLE_COLUMNS) {
    const val = row[col];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return 'Untitled';
}

function resolveMediaUrl(row: any): string | null {
  for (const col of MEDIA_COLUMNS) {
    const val = row[col];
    if (val && typeof val === 'string' && val.length > 3) {
      if (!val.startsWith('http')) {
        try {
          const { data } = supabase.storage.from('media').getPublicUrl(val);
          if (data?.publicUrl) return data.publicUrl;
        } catch {}
      }
      return val;
    }
  }
  return null;
}

function detectMediaType(row: any, mediaUrl: string | null): UnifiedContentItem['mediaType'] {
  if (row.is_live === true || row.status === 'live' || row.stream_url) return 'live';
  if (row.media_type === 'video' || row.type === 'video') return 'video';
  if (row.media_type === 'image' || row.type === 'image' || row.type === 'photo') return 'image';
  if (row.media_type === 'audio' || row.type === 'audio' || row.type === 'music') return 'audio';
  if (mediaUrl) {
    const lower = mediaUrl.toLowerCase();
    if (lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.avi') || lower.includes('.mkv') || lower.includes('.webm')) return 'video';
    if (lower.includes('.mp3') || lower.includes('.wav') || lower.includes('.aac') || lower.includes('.ogg') || lower.includes('.m4a')) return 'audio';
    if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.gif') || lower.includes('.webp') || lower.includes('.bmp')) return 'image';
  }
  return 'post';
}

function resolveCount(row: any, type: 'likes' | 'views' | 'comments' | 'shares'): number {
  const prefixes = type === 'likes' ? ['likes_count', 'like_count', 'likes', 'total_likes'] :
                   type === 'views' ? ['views_count', 'view_count', 'views', 'total_views', 'plays_count', 'play_count', 'plays'] :
                   type === 'comments' ? ['comments_count', 'comment_count', 'comments', 'total_comments'] :
                   ['shares_count', 'share_count', 'shares', 'total_shares'];
  for (const col of prefixes) {
    const val = row[col];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function normalizeRow(row: any, tableName: string): UnifiedContentItem | null {
  if (!row || typeof row !== 'object') return null;
  const id = row.id || row.uuid || row.post_id || row.video_id || row.content_id;
  if (!id) return null;

  const creatorId = row.creator_id || row.user_id || row.author_id || row.owner_id || row.profile_id;
  const thumbnail = resolveThumbnail(row);
  const mediaUrl = resolveMediaUrl(row);
  const mediaType = detectMediaType(row, mediaUrl);

  return {
    id: String(id),
    sourceTable: tableName,
    sourceId: String(id),
    title: resolveTitle(row),
    thumbnail,
    mediaUrl,
    mediaType,
    creatorId: creatorId ? String(creatorId) : '',
    createdAt: row.created_at || row.createdAt || row.published_at || row.timestamp || new Date().toISOString(),
    likes: resolveCount(row, 'likes'),
    views: resolveCount(row, 'views'),
    comments: resolveCount(row, 'comments'),
    shares: resolveCount(row, 'shares'),
    duration: row.duration || row.length || row.video_duration || 0,
    isLive: row.is_live === true || row.status === 'live',
    debug: { rawThumbnail: row.thumbnail_url, rawMedia: row.media_url },
  };
}

const CONTENT_SOURCES = [
  { table: 'streets_posts', idCol: 'creator_id', order: 'created_at', label: 'Streets Post' },
  { table: 'streets', idCol: 'creator_id', order: 'created_at', label: 'Streets' },
  { table: 'studio_videos', idCol: 'creator_id', order: 'created_at', label: 'Studio Video' },
  { table: 'studio_videos_with_creator', idCol: 'creator_id', order: 'created_at', label: 'Studio Video (WC)' },
  { table: 'studio_content', idCol: 'user_id', order: 'created_at', label: 'Studio Content' },
  { table: 'studio_community_posts', idCol: 'creator_id', order: 'created_at', label: 'Community Post' },
  { table: 'studio_live_streams', idCol: 'creator_id', order: 'created_at', label: 'Live Stream' },
  { table: 'studio_music_releases', idCol: 'creator_id', order: 'created_at', label: 'Music Release' },
  { table: 'studio_music_tracks', idCol: 'creator_id', order: 'created_at', label: 'Music Track' },
  { table: 'studio_podcasts', idCol: 'creator_id', order: 'created_at', label: 'Podcast' },
  { table: 'studio_recordings', idCol: 'creator_id', order: 'created_at', label: 'Recording' },
  { table: 'studio_drafts', idCol: 'creator_id', order: 'created_at', label: 'Draft' },
  { table: 'studio_education_content', idCol: 'creator_id', order: 'created_at', label: 'Education' },
  { table: 'tribe_posts', idCol: 'author_id', order: 'created_at', label: 'Tribe Post' },
  { table: 'content', idCol: 'user_id', order: 'created_at', label: 'Content' },
  { table: 'post_stories', idCol: 'user_id', order: 'created_at', label: 'Story' },
];

export interface ContentFetchResult {
  items: UnifiedContentItem[];
  debug: { table: string; status: string; count: number; error?: string }[];
}

export async function fetchUserContent(userId: string): Promise<ContentFetchResult> {
  const items: UnifiedContentItem[] = [];
  const debug: ContentFetchResult['debug'] = [];

  for (const source of CONTENT_SOURCES) {
    try {
      const { data, error } = await supabase
        .from(source.table)
        .select('*')
        .eq(source.idCol, userId)
        .order(source.order, { ascending: false })
        .limit(50);

      if (error) {
        debug.push({ table: source.table, status: 'ERROR', count: 0, error: error.message });
        continue;
      }

      const normalized = (data || [])
        .map((row: any) => normalizeRow(row, source.table))
        .filter((item): item is UnifiedContentItem => item !== null);

      items.push(...normalized);
      debug.push({ table: source.table, status: 'OK', count: normalized.length });
    } catch (err: any) {
      debug.push({ table: source.table, status: 'EXCEPTION', count: 0, error: err.message });
    }
  }

  // Sort by created_at desc
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { items, debug };
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserStats(userId: string) {
  // Aggregate stats from various tables
  const stats = { posts: 0, followers: 0, following: 0, likes: 0, views: 0 };
  try {
    const { count: postsCount } = await supabase.from('streets_posts').select('*', { count: 'exact', head: true }).eq('creator_id', userId);
    stats.posts = postsCount || 0;
  } catch {}
  try {
    const { count: followersCount } = await supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('followed_id', userId);
    stats.followers = followersCount || 0;
  } catch {}
  try {
    const { count: followingCount } = await supabase.from('user_followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    stats.following = followingCount || 0;
  } catch {}
  try {
    const { count: likesCount } = await supabase.from('streets_likes').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    stats.likes = likesCount || 0;
  } catch {}
  return stats;
}
