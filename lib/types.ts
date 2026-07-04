export interface ServiceResult<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  error: string | null;
  status: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PostItem {
  id: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  thumbnail_url?: string;
  video_thumbnail_url?: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
}
