export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  profession: string | null;
  skills: string[] | null;
  experience_years: number | null;
  is_verified: boolean;
  verification_status: string | null;
  kyc_level: number;
  kyc_verified_at: string | null;
  role: string;
  follower_count: number;
  following_count: number;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  // New columns (added by migration)
  mtaa_id: string | null;
  online_status: 'online' | 'away' | 'offline' | 'invisible' | null;
  trust_score: number;
  completion_percentage: number;
  languages: string[] | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_say' | null;
  slug: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
}

export interface ProfileConnection {
  id: string;
  profile_id: string;
  connected_profile_id: string;
  connection_type: string;
  status: 'pending' | 'active' | 'blocked' | 'removed';
  initiated_by: string;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProfileAnalytics {
  id: string;
  profile_id: string;
  date: string;
  profile_views: number;
  portfolio_views: number;
  business_views: number;
  service_views: number;
  product_views: number;
  job_invitations: number;
  service_requests: number;
  product_sales: number;
  community_reach: number;
  revenue_generated: number;
  new_followers: number;
  new_connections: number;
  metadata: Record<string, any>;
}

export interface ProfileSettings {
  id: string;
  profile_id: string;
  is_profile_public: boolean;
  is_portfolio_public: boolean;
  is_achievements_public: boolean;
  is_skills_public: boolean;
  allow_messages_from: 'all' | 'connections' | 'none';
  allow_calls_from: 'all' | 'connections' | 'none';
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  allow_tagging: boolean;
  updated_at: string;
}
