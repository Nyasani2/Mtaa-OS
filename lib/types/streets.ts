import type { Database } from './supabase';

export type StreetsPost = Database['public']['Tables']['streets_posts']['Row'] & {
  creator?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null;
};

export type StreetsComment = Database['public']['Tables']['streets_comments']['Row'] & {
  user_name?: string | null;
  user_avatar?: string | null;
};

export type StreetsLike = Database['public']['Tables']['streets_likes']['Row'];

export interface CreatePostInput {
  content: string;
  caption?: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | 'text';
  hashtags?: string[];
  is_public?: boolean;
  allow_comments?: boolean;
}

export interface UseStreetsReturn {
  posts: StreetsPost[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<StreetsPost>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  getPostById: (postId: string) => Promise<StreetsPost | null>;
}
