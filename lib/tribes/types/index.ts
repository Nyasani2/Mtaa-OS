// lib/tribes/types/index.ts
export interface TribePost {
  id: string;
  tribe_id: string;
  author_id: string;
  content: string;
  content_type: "event" | "text" | "image" | "video" | "audio" | "poll" | "artifact";
  media_urls?: string[];
  likes: number;
  comments: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  poll_data?: any;
  artifact_data?: any;
  is_pinned?: boolean;
  is_announcement?: boolean;
  status?: "published" | "draft" | "archived" | "deleted";
  created_at: string;
  updated_at?: string;
}

export interface TribeMessage {
  id: string;
  tribe_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
}

export interface Tribe {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_count?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
}
