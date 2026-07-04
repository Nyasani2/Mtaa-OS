import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { getThumbnailAsync } from 'expo-video-thumbnails';

export interface CompressResult {
  uri: string;
  size: number;
  type: 'image' | 'video';
  thumbnailUri?: string;
}

const MAX_IMAGE_DIMENSION = 1080;      // Max width/height for images
const MAX_IMAGE_SIZE_MB = 2;          // Target max image size
const MAX_VIDEO_SIZE_MB = 6;          // Target max video size
const THUMBNAIL_DIMENSION = 480;      // Thumbnail size
const JPEG_QUALITY = 0.7;             // 70% quality

/**
 * Compress an image before upload
 */
export async function compressImage(fileUri: string): Promise<CompressResult> {
  // Get original dimensions
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  const originalSize = 'size' in fileInfo ? fileInfo.size : 0;

  // Resize if needed
  const manipulated = await ImageManipulator.manipulateAsync(
    fileUri,
    [{ resize: { width: MAX_IMAGE_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Check if still too large, compress more
  const newInfo = await FileSystem.getInfoAsync(manipulated.uri);
  const newSize = 'size' in newInfo ? newInfo.size : 0;

  if (newSize > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    // Compress more aggressively
    const moreCompressed = await ImageManipulator.manipulateAsync(
      manipulated.uri,
      [{ resize: { width: Math.round(MAX_IMAGE_DIMENSION * 0.7) } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    const finalInfo = await FileSystem.getInfoAsync(moreCompressed.uri);
    return {
      uri: moreCompressed.uri,
      size: 'size' in finalInfo ? finalInfo.size : 0,
      type: 'image',
    };
  }

  return {
    uri: manipulated.uri,
    size: newSize,
    type: 'image',
  };
}

/**
 * Compress/generate thumbnail for video
 * Note: Actual video transcoding requires expo-video-manipulator or ffmpeg
 * This generates a thumbnail and returns the original video with size check
 */
export async function compressVideo(fileUri: string): Promise<CompressResult> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  const originalSize = 'size' in fileInfo ? fileInfo.size : 0;

  // Generate thumbnail
  let thumbnailUri: string | undefined;
  try {
    const { uri } = await getThumbnailAsync(fileUri, {
      time: 1000, // 1 second in
      quality: 0.5,
    });
    // Compress thumbnail too
    const compressedThumb = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: THUMBNAIL_DIMENSION } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    thumbnailUri = compressedThumb.uri;
  } catch (e) {
    console.warn('[MediaCompressor] Thumbnail generation failed:', e);
  }

  // For now, we can't easily transcode video in Expo without heavy libraries
  // Return original with warning if too large
  if (originalSize > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    console.warn(
      `[MediaCompressor] Video ${(originalSize / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_VIDEO_SIZE_MB}MB limit. ` +
      'Consider using expo-video-manipulator or uploading to a compression service.'
    );
  }

  return {
    uri: fileUri,
    size: originalSize,
    type: 'video',
    thumbnailUri,
  };
}

/**
 * Generic compress function — auto-detects type
 */
export async function compressMedia(fileUri: string, mimeType: string): Promise<CompressResult> {
  if (mimeType.startsWith('image/')) {
    return compressImage(fileUri);
  }
  if (mimeType.startsWith('video/')) {
    return compressVideo(fileUri);
  }
  // Unknown type — return as-is
  const info = await FileSystem.getInfoAsync(fileUri);
  return {
    uri: fileUri,
    size: 'size' in info ? info.size : 0,
    type: mimeType.startsWith('audio/') ? 'image' : 'image', // fallback
  };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
