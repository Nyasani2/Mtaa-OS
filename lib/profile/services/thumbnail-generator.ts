import { supabase } from '@/lib/supabase';

/**
 * Auto-generate a thumbnail for a video post.
 * In production, this calls a Supabase Edge Function that extracts
 * a frame from the video using FFmpeg or a cloud service.
 * 
 * For now, it generates a placeholder thumbnail URL pattern that
 * your video player or CDN can use for frame extraction.
 */
export async function generateVideoThumbnail(
  postId: string,
  videoUrl: string
): Promise<string | null> {
  try {
    // Strategy 1: If video is hosted on a CDN that supports frame extraction
    // (e.g., Cloudflare Stream, Mux, AWS MediaConvert)
    if (videoUrl.includes('cloudflare') || videoUrl.includes('mux.com')) {
      // These services provide thumbnail URLs automatically
      const thumbUrl = videoUrl.replace(/\.[^/.]+$/, '_thumb.jpg');
      await updatePostThumbnail(postId, thumbUrl);
      return thumbUrl;
    }

    // Strategy 2: Call edge function for FFmpeg-based extraction
    const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
      body: { videoUrl, postId },
    });

    if (error) {
      console.warn('[Thumbnail] Edge function failed:', error);
      // Fallback: use video URL as thumbnail (some players support this)
      return videoUrl;
    }

    if (data?.thumbnailUrl) {
      await updatePostThumbnail(postId, data.thumbnailUrl);
      return data.thumbnailUrl;
    }

    return null;
  } catch (err) {
    console.error('[Thumbnail] Generation failed:', err);
    return null;
  }
}

/**
 * Update the thumbnail URL for a post in the database.
 */
async function updatePostThumbnail(postId: string, thumbnailUrl: string) {
  await supabase
    .from('streets_posts')
    .update({ 
      thumbnail_url: thumbnailUrl,
      video_thumbnail_url: thumbnailUrl,
    })
    .eq('id', postId);
}

/**
 * Generate thumbnails for all videos in a user's profile that don't have one.
 */
export async function backfillVideoThumbnails(userId: string): Promise<number> {
  const { data: videos } = await supabase
    .from('streets_posts')
    .select('id, media_url')
    .eq('creator_id', userId)
    .eq('media_type', 'video')
    .is('thumbnail_url', null);

  if (!videos?.length) return 0;

  let fixed = 0;
  for (const video of videos) {
    if (video.media_url) {
      const thumb = await generateVideoThumbnail(video.id, video.media_url);
      if (thumb) fixed++;
    }
  }
  return fixed;
}

/**
 * Check if a URL is a valid video that could have a thumbnail extracted.
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lower = url.toLowerCase();
  return videoExts.some(ext => lower.includes(ext)) || lower.includes('video');
}

/**
 * Get the best thumbnail URL for a post, with fallbacks.
 */
export function getBestThumbnail(post: any): string | null {
  if (!post) return null;

  // Priority order for thumbnails
  return post.thumbnail_url 
    || post.video_thumbnail_url 
    || (isVideoUrl(post.media_url) ? post.media_url : null)
    || post.media_url 
    || null;
}
