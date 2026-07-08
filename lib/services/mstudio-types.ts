// mstudio-types.ts — MTAA MStudio TypeScript Types
export type MStudioContentType = 'video' | 'live' | 'short' | 'audio' | 'podcast' | 'reel';
export type MStudioVisibility = 'public' | 'unlisted' | 'private' | 'scheduled' | 'draft';
export type MStudioLiveStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type MStudioMonetizationType = 'ads' | 'super_chat' | 'memberships' | 'tips' | 'sponsorship' | 'merch';
export type MStudioQuality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';
export type MStudioProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'queued';
export type MStudioDeviceRole = 'camera' | 'director' | 'viewer' | 'audio' | 'lighting';
export type MStudioApprovalStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface MStudioStudio {
  id: string; user_id: string; name: string; handle: string;
  description?: string; avatar_url?: string; banner_url?: string; category?: string;
  subscriber_count: number; total_views: number; total_videos: number;
  is_verified: boolean; is_monetized: boolean;
  monetization_settings?: Record<string, any>;
  created_at: string; updated_at: string;
}

export interface MStudioVideo {
  id: string; studio_id: string; user_id: string; title: string;
  description?: string; content_type: MStudioContentType; visibility: MStudioVisibility;
  video_url?: string; thumbnail_url?: string; duration: number; file_size?: number;
  quality: MStudioQuality; processing_status: MStudioProcessingStatus;
  tags?: string[]; category?: string; language: string;
  is_age_restricted: boolean; is_4k: boolean; is_hdr: boolean;
  view_count: number; like_count: number; dislike_count: number;
  comment_count: number; share_count: number;
  monetization_type: MStudioMonetizationType; monetization_enabled: boolean;
  scheduled_at?: string; published_at?: string;
  created_at: string; updated_at: string;
}

export interface MStudioLiveStream {
  id: string; studio_id: string; user_id: string; video_id?: string;
  title: string; description?: string; stream_key?: string; rtmp_url?: string;
  playback_url?: string; thumbnail_url?: string; status: MStudioLiveStatus;
  scheduled_start?: string; actual_start?: string; ended_at?: string;
  max_viewers: number; total_viewers: number; current_viewers: number;
  total_super_chat: number; monetization_enabled: boolean;
  chat_enabled: boolean; chat_slow_mode: number; chat_members_only: boolean;
  created_at: string; updated_at: string;
}

export interface MStudioLiveChatMessage {
  id: string; stream_id: string; user_id: string; message: string;
  is_super_chat: boolean; super_chat_amount: number; super_chat_currency: string;
  is_pinned: boolean; is_deleted: boolean; reply_to?: string;
  created_at: string; full_name?: string; avatar_url?: string;
}

export interface MStudioSuperChat {
  id: string; stream_id: string; sender_id: string; receiver_id: string;
  amount: number; currency: string; message?: string; color: string;
  is_paid: boolean; paid_at?: string; wallet_transaction_id?: string;
  created_at: string; sender_name?: string;
}

export interface MStudioProject {
  id: string; user_id: string; title: string; description?: string;
  video_id?: string; timeline?: Record<string, any>; scenes?: any[];
  assets?: any[]; export_settings?: Record<string, any>;
  is_auto_save_enabled: boolean; last_saved_at: string;
  created_at: string; updated_at: string;
}

export interface MStudioProjectScene {
  id: string; project_id: string; scene_order: number; title?: string;
  start_time: number; end_time: number; media_url?: string;
  media_type: string; filters?: any[]; transitions?: any[];
  text_overlays?: any[]; ai_detected_scenes?: any[];
  thumbnail_url?: string; created_at: string;
}

export interface MStudioComment {
  id: string; video_id: string; user_id: string; parent_id?: string;
  content: string; like_count: number; dislike_count: number;
  reply_count: number; is_pinned: boolean; is_hearted: boolean;
  is_deleted: boolean; created_at: string; updated_at: string;
  full_name?: string; avatar_url?: string;
}

export interface MStudioSubscription {
  id: string; studio_id: string; subscriber_id: string; tier: string;
  price: number; is_active: boolean; expires_at?: string;
  auto_renew: boolean; created_at: string;
}

export interface MStudioWatchHistory {
  id: string; user_id: string; video_id: string;
  watch_duration: number; total_duration: number;
  progress_percent: number; is_completed: boolean; watched_at: string;
}

export interface MStudioPlaylist {
  id: string; studio_id: string; user_id: string; title: string;
  description?: string; thumbnail_url?: string; is_public: boolean;
  video_count: number; total_duration: number;
  created_at: string; updated_at: string;
}

export interface MStudioRevenue {
  id: string; studio_id: string; user_id: string; video_id?: string;
  stream_id?: string; revenue_type: MStudioMonetizationType;
  amount: number; currency: string; platform_fee: number;
  net_amount: number; is_paid_out: boolean; paid_at?: string;
  wallet_transaction_id?: string; created_at: string;
}

export interface MStudioAnalyticsDaily {
  id: string; studio_id: string; video_id?: string; date: string;
  views: number; watch_time_seconds: number; likes: number;
  comments: number; shares: number; subscribers_gained: number;
  subscribers_lost: number; revenue: number; impressions: number;
  click_through_rate: number; average_view_duration: number;
}

export interface MStudioThumbnail {
  id: string; video_id: string; user_id: string; image_url: string;
  is_ai_generated: boolean; ai_prompt?: string; is_selected: boolean; created_at: string;
}

export interface MStudioMusicTrack {
  id: string; user_id: string; title: string; artist?: string;
  album?: string; genre?: string; duration: number; file_url?: string;
  file_size?: number; is_licensed: boolean; license_type?: string;
  is_original: boolean; is_approved: MStudioApprovalStatus;
  usage_count: number; created_at: string; updated_at: string;
}

export interface MStudioDraft {
  id: string; user_id: string; video_id?: string; project_id?: string;
  title?: string; content_type: MStudioContentType;
  thumbnail_url?: string; saved_data?: Record<string, any>;
  last_edited_at: string; created_at: string;
}

export interface MStudioPairingSession {
  id: string; director_id: string; session_code: string;
  title?: string; status: string; max_devices: number;
  created_at: string; ended_at?: string;
}

export interface MStudioPairedDevice {
  id: string; session_id: string; device_id: string;
  device_name?: string; device_role: MStudioDeviceRole;
  user_id?: string; is_connected: boolean; last_heartbeat: string;
  created_at: string; user_name?: string;
}

export interface MStudioSceneDetection {
  id: string; video_id: string; scene_start: number; scene_end: number;
  confidence: number; scene_type?: string; detected_objects?: any[];
  thumbnail_url?: string; created_at: string;
}

export interface MStudioRecording {
  id: string; user_id: string; video_id?: string; project_id?: string;
  file_url?: string; file_size?: number; duration: number;
  quality: MStudioQuality; device_info?: Record<string, any>;
  is_uploaded: boolean; uploaded_at?: string; created_at: string;
}

export interface MStudioNotification {
  id: string; user_id: string; type: string; title: string;
  body?: string; data?: Record<string, any>; is_read: boolean;
  read_at?: string; created_at: string;
}

export interface MStudioCommunityPost {
  id: string; studio_id: string; user_id: string; content: string;
  media_urls?: string[]; poll_data?: Record<string, any>;
  like_count: number; comment_count: number; is_pinned: boolean;
  created_at: string; updated_at: string;
  author_name?: string; author_avatar?: string;
}

export interface MStudioMembershipTier {
  id: string; studio_id: string; name: string; description?: string;
  price: number; currency: string; benefits?: any[];
  badge_url?: string; is_active: boolean; created_at: string;
}

export interface MStudioMerch {
  id: string; studio_id: string; name: string; description?: string;
  price: number; currency: string; image_urls?: string[];
  inventory_count: number; is_active: boolean; created_at: string;
}

export interface MStudioTip {
  id: string; studio_id: string; sender_id: string; receiver_id: string;
  amount: number; currency: string; message?: string; is_paid: boolean;
  paid_at?: string; wallet_transaction_id?: string; created_at: string;
  sender_name?: string;
}

export interface MStudioASISContent {
  id: string; user_id: string; video_id?: string; project_id?: string;
  prompt: string; generated_type: string; generated_data?: Record<string, any>;
  generated_url?: string; ai_model: string; is_approved: boolean; created_at: string;
}

export interface MStudioFeedFilters {
  category?: string; content_type?: MStudioContentType;
  limit?: number; offset?: number;
}

export interface MStudioSearchResult {
  videos: Array<{
    id: string; title: string; thumbnail_url?: string; view_count: number;
    published_at?: string; result_type: string; studio_name?: string; studio_handle?: string;
  }>;
  studios: Array<{
    id: string; name: string; handle: string; avatar_url?: string;
    subscriber_count: number; result_type: string;
  }>;
}

export interface MStudioDashboardStats {
  studio_id: string; name: string; handle: string;
  subscribers: number; total_views: number; total_videos: number;
  is_monetized: boolean; videos_last_30d: number; active_streams: number;
  total_revenue: number; total_net_revenue: number;
}

export interface MStudioRevenueSummary {
  total_revenue: number; total_net: number; total_platform_fees: number;
  by_type: Record<string, number>;
  daily: Array<{ date: string; revenue: number; views: number }>;
}

export interface MStudioAnalyticsPoint {
  date: string; views: number; watch_time_seconds: number;
  likes: number; comments: number; shares: number;
  revenue: number; impressions: number; ctr: number;
  avg_view_duration: number;
}
