// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface StorageStats {
  totalBytes: number;
  totalGB: number;
  usedBytes: number;
  usedGB: number;
  availableBytes: number;
  availableGB: number;
  recordingCount: number;
  evidenceCount: number;
}

export async function uploadRecording(
  fileUri: string,
  path: string,
  contentType: string = 'video/mp4',
  onProgress?: (progress: number) => void
) {
  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(path, fileUri, {
      contentType,
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function uploadThumbnail(
  fileUri: string,
  path: string,
  onProgress?: (progress: number) => void
) {
  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(path, fileUri, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function getRecordingUrl(path: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from('recordings')
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data?.signedUrl;
}

export async function getThumbnailUrl(path: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from('thumbnails')
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data?.signedUrl;
}

export async function deleteRecordingFile(path: string) {
  const { error } = await supabase.storage.from('recordings').remove([path]);
  if (error) throw error;
}

export async function getStorageBucketStats(): Promise<StorageStats> {
  // Get recordings bucket info
  const { data: recordingsList } = await supabase.storage.from('recordings').list();
  const { data: evidenceList } = await supabase.storage.from('evidence').list();

  // Calculate sizes (approximate from metadata)
  let usedBytes = 0;
  (recordingsList || []).forEach((item: any) => {
    usedBytes += item.metadata?.size || 0;
  });
  (evidenceList || []).forEach((item: any) => {
    usedBytes += item.metadata?.size || 0;
  });

  // Get counts from database
  const { count: recordingCount } = await supabase
    .from('recordings')
    .select('*', { count: 'exact', head: true });

  const { count: evidenceCount } = await supabase
    .from('evidence')
    .select('*', { count: 'exact', head: true });

  const totalGB = 100; // Configurable limit
  const totalBytes = totalGB * 1024 * 1024 * 1024;

  return {
    totalBytes,
    totalGB,
    usedBytes,
    usedGB: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
    availableBytes: totalBytes - usedBytes,
    availableGB: Math.round(((totalBytes - usedBytes) / (1024 * 1024 * 1024)) * 100) / 100,
    recordingCount: recordingCount || 0,
    evidenceCount: evidenceCount || 0,
  };
}

export async function cleanupOldRecordings(retentionDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Find old non-evidence recordings
  const { data: oldRecordings } = await supabase
    .from('recordings')
    .select('id, storage_path')
    .lt('created_at', cutoffDate.toISOString())
    .eq('upload_status', 'uploaded')
    .not('id', 'in', (
      supabase.from('evidence').select('recording_id')
    ));

  const pathsToDelete = (oldRecordings || [])
    .map((r: any) => r.storage_path)
    .filter(Boolean);

  if (pathsToDelete.length > 0) {
    await supabase.storage.from('recordings').remove(pathsToDelete);
    await supabase.from('recordings').delete().in('id', (oldRecordings || []).map((r: any) => r.id));
  }

  return { deleted: pathsToDelete.length };
}

export async function archiveRecording(recordingId: string) {
  const { data, error } = await supabase
    .from('recordings')
    .update({ upload_status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', recordingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
