// domains/streets/types.ts
// Shared types for Streets module

export interface StreetUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string;
  verified: boolean;
  follower_count: number;
  following_count: number;
}

export interface StreetPost {
  id: string;
  creator_id: string;
  author: StreetUser;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface StreetComment {
  id: string;
  post_id: string;
  creator_id: string;
  author: StreetUser;
  content: string;
  likes_count: number;
  replies_count: number;
  parent_id: string | null;
  created_at: string;
}

export interface StreetAd {
  id: string;
  advertiser_id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

export interface StreetJob {
  id: string;
  employer_id: string;
  employer: StreetUser;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  skills: string[];
  applications_count: number;
  status: 'open' | 'closed';
  created_at: string;
}

export interface StreetMessage {
  id: string;
  sender_id: string;
  sender: StreetUser;
  recipient_id: string;
  content: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface StreetLiveStream {
  id: string;
  host_id: string;
  host: StreetUser;
  title: string;
  thumbnail_url: string | null;
  viewer_count: number;
  is_live: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface StreetNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'job' | 'ad';
  actor: StreetUser;
  reference_id: string;
  reference_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface StreetCreatorStats {
  follower_count: number;
  following_count: number;
  post_count: number;
  total_likes: number;
  total_views: number;
  earnings: number;
}

export interface StreetReport {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: 'post' | 'comment' | 'user' | 'ad';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface StreetSettings {
  user_id: string;
  is_private: boolean;
  allow_messages: boolean;
  allow_mentions: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface StreetShopItem {
  id: string;
  seller_id: string;
  seller: StreetUser;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_urls: string[];
  stock: number;
  category: string;
  rating: number;
  reviews_count: number;
  status: 'active' | 'sold_out' | 'archived';
  created_at: string;
}

export interface StreetWallet {
  balance: number;
  currency: string;
  transactions: StreetWalletTransaction[];
}

export interface StreetWalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
