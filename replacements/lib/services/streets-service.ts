export interface StreetsPost {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked_by_user: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
    username?: string;
  };
}

export async function getFeedPosts(options?: { page?: number; limit?: number }) {
  return { data: [] as StreetsPost[], error: null };
}

export async function likePost(postId: string, userId: string) {
  return { success: true };
}

export async function unlikePost(postId: string, userId: string) {
  return { success: true };
}

export async function createPost(data: any) {
  return { data: null, error: null };
}

export async function getPostById(postId: string) {
  return { data: null, error: null };
}

export async function addComment(postId: string, userId: string, content: string) {
  return { data: null, error: null };
}

export async function sharePost(postId: string, userId: string) {
  return { success: true };
}

export async function deletePost(postId: string) {
  return { success: true };
}

export async function getTrendingHashtags() {
  return { data: [], error: null };
}

export async function searchPosts(query: string) {
  return { data: [], error: null };
}

export async function getPostsByUser(userId: string) {
  return { data: [], error: null };
}

export async function getPostsByHashtag(tag: string) {
  return { data: [], error: null };
}

export async function getNotifications(userId: string) {
  return { data: [], error: null };
}

export async function markNotificationRead(notificationId: string) {
  return { success: true };
}
