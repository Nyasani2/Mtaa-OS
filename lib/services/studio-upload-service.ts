import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'react-native-compressor';
import { supabase } from '@/lib/supabase';

export interface UploadItem {
  uri: string; name: string; size: number; type: string; progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error'; finalUrl?: string;
}

export const pickFiles = async (maxFiles: number = 5): Promise<UploadItem[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/*', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return [];
    return result.assets.slice(0, maxFiles).map(asset => ({
      uri: asset.uri, name: asset.name || 'untitled', size: asset.size || 0, type: asset.mimeType || 'video/mp4', progress: 0, status: 'pending'
    }));
  } catch (error) { console.error('Pick error:', error); return []; }
};

export const compressVideo = async (uri: string): Promise<string> => {
  try {
    // @ts-ignore
    return await Video.compress(uri, { compressionMethod: 'auto', maxWidth: 1280, maxHeight: 720, bitrate: 2000000, progressDivider: 10 });
  } catch (error) { console.error('Compression failed, using original:', error); return uri; }
};

export const uploadToStorage = async (fileUri: string, fileName: string, userId: string, bucketName: string = 'mstudio-videos'): Promise<string> => {
  const fileExt = fileName.split('.').pop() || 'mp4';
  const path = `${userId}/${Date.now()}_${fileName}`;
  const fileBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = new Uint8Array(atob(fileBase64).split('').map(c => c.charCodeAt(0)));

  const { error } = await supabase.storage.from(bucketName).upload(path, bytes, {
    contentType: fileExt === 'mp4' ? 'video/mp4' : fileExt === 'webm' ? 'video/webm' : 'video/mp4', upsert: false,
  });
  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
  return publicUrlData.publicUrl;
};

export const saveTrackMetadata = async (userId: string, title: string, genre: string, videoUrl: string, duration?: number, adSlots?: any[]) => {
  const { error } = await supabase.from('studio_tracks').insert({
    creator_id: userId, title: title, genre: genre, media_url: videoUrl, duration: duration || 0, ad_slots: adSlots || [], status: 'published', created_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const addAdSlots = (duration: number, adFrequency: 'low' | 'medium' | 'high' = 'medium'): number[] => {
  const slots: number[] = [];
  const interval = adFrequency === 'low' ? 300 : adFrequency === 'medium' ? 180 : 120;
  for (let t = interval; t < duration; t += interval) { slots.push(t); }
  return slots;
};
