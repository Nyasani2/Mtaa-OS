// lib/streets/types.ts
// MTAA Streets — Complete Type System (aligned to streets_* schema tables)

export interface StreetPost {
  id: string;
  creator_id: string;
  content: string;
  media_urls: string[];
  media_type: 'image' | 'video' | 'audio' | 'none';
  location?: { lat: number; lng: number; name?: string };
  visibility: 'public' | 'friends' | 'private' | 'tribe';
  tribe_id?: string;
  tags: string[];
  mentions: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author?: StreetProfile;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
}

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  media_url?: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  author?: StreetProfile;
  liked_by_me?: boolean;
  replies?: StreetComment[];
}

export interface StreetProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  cover_url?: string;
  bio: string;
  location?: string;
  website?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  is_verified: boolean;
  is_business: boolean;
  created_at: string;
  is_following?: boolean;
}

export interface StreetLive {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_url: string;
  status: 'live' | 'ended' | 'scheduled';
  viewer_count: number;
  peak_viewers: number;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  author?: StreetProfile;
}

export interface StreetMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_urls: string[];
  media_type: 'image' | 'video' | 'audio' | 'file' | 'none';
  is_read: boolean;
  read_at?: string;
  reply_to_id?: string;
  created_at: string;
  sender?: StreetProfile;
}

export interface StreetConversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  participant_ids: string[];
  last_message?: StreetMessage;
  unread_count: number;
  created_at: string;
  updated_at: string;
  participants?: StreetProfile[];
}

export interface StreetNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'live' | 'message' | 'system';
  actor_id?: string;
  target_id?: string;
  target_type?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: StreetProfile;
}

export interface StreetAd {
  id: string;
  user_id: string;
  title: string;
  description: string;
  media_urls: string[];
  cta_text: string;
  cta_url: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StreetShopItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  media_urls: string[];
  category: string;
  stock: number;
  sold_count: number;
  status: 'active' | 'sold_out' | 'hidden';
  location?: { lat: number; lng: number; name?: string };
  created_at: string;
  updated_at: string;
  seller?: StreetProfile;
}

export interface StreetJob {
  id: string;
  user_id: string;
  title: string;
  description: string;
  company_name?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  category: string;
  skills: string[];
  requirements: string[];
  status: 'open' | 'closed' | 'filled';
  application_count: number;
  created_at: string;
  updated_at: string;
  poster?: StreetProfile;
}

export interface StreetMarketplaceItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  media_urls: string[];
  category: string;
  location?: { lat: number; lng: number; name?: string };
  status: 'available' | 'reserved' | 'sold';
  view_count: number;
  created_at: string;
  updated_at: string;
  seller?: StreetProfile;
}

export interface StreetCreatorStudioMetrics {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_followers: number;
  follower_growth_7d: number;
  follower_growth_30d: number;
  top_posts: StreetPost[];
  audience_demographics?: Record<string, any>;
  engagement_rate: number;
}

export interface StreetReport {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: 'post' | 'comment' | 'user' | 'message' | 'ad' | 'shop_item' | 'job' | 'marketplace_item';
  reason: string;
  details?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface StreetFeedFilters {
  type?: 'all' | 'following' | 'trending' | 'nearby' | 'tribe';
  tribe_id?: string;
  media_type?: 'all' | 'image' | 'video' | 'audio' | 'text';
  time_range?: 'today' | 'week' | 'month' | 'all';
  location?: { lat: number; lng: number; radius: number };
}

export interface StreetDiscoverFilters {
  category?: string;
  trending?: boolean;
  location?: { lat: number; lng: number; radius: number };
  tags?: string[];
}

export type StreetTab = 'feed' | 'discover' | 'create' | 'inbox' | 'profile';
