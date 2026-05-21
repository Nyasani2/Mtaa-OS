export interface Tribe {
  id: string;
  name: string;
  slug: string;
  category: 'ethnic' | 'interest' | 'heritage' | 'profession' | 'location' | 'vehicle' | 'brand';
  description: string | null;
  short_description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  region: string | null;
  country: string;
  language: string | null;
  population_count: number;
  member_count: number;
  post_count: number;
  event_count: number;
  is_verified: boolean;
  is_ai_populated: boolean;
  ai_content: Record<string, any>;
  history: string | null;
  religion: string | null;
  artifacts: any[];
  traditions: any[];
  notable_figures: any[];
  cuisine: any[];
  music_dance: any[];
  attire: any[];
  language_phrases: any[];
  external_links: any[];
  created_by: string | null;
  status: 'active' | 'archived' | 'pending_review';
  created_at: string;
  updated_at: string;
}

export interface TribeMember {
  id: string;
  tribe_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin' | 'elder';
  membership_status: 'pending' | 'approved' | 'banned';
  joined_at: string;
  last_active_at: string;
  notifications_enabled: boolean;
  profile?: { full_name: string | null; avatar_url: string | null };
}

export interface TribePost {
  id: string;
  tribe_id: string;
  author_id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'audio' | 'poll' | 'event' | 'artifact';
  media_urls: string[];
  poll_data: Record<string, any> | null;
  artifact_data: Record<string, any> | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  is_announcement: boolean;
  status: 'published' | 'pending' | 'rejected' | 'archived';
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
  user_liked?: boolean;
}

export interface TribeEvent {
  id: string;
  tribe_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_type: 'gathering' | 'ceremony' | 'festival' | 'meeting' | 'celebration' | 'mourning' | 'learning';
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  end_time: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  max_attendees: number | null;
  attendee_count: number;
  cover_url: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  creator?: { full_name: string | null; avatar_url: string | null };
  user_rsvp?: string | null;
}

export interface TribeMessage {
  id: string;
  tribe_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'system';
  media_url: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: { full_name: string | null; avatar_url: string | null };
}

export interface TribeAIContent {
  id: string;
  tribe_id: string;
  content_type: 'history' | 'religion' | 'artifact' | 'tradition' | 'figure' | 'cuisine' | 'music' | 'language';
  title: string;
  content: string;
  sources: any[];
  verified_by: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}
