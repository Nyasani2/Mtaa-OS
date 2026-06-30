// lib/utils/storage-upload.ts
// Universal upload utility for MTAA — handles base64, file URIs, web/native

import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface UploadResult {
  publicUrl: string;
  path: string;
  bucket: string;
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  userId: string;
  contentType?: string;
  upsert?: boolean;
}

function isBase64DataUri(uri: string): boolean {
  return uri.startsWith('data:');
}

function getExtensionFromUri(uri: string): string {
  if (isBase64DataUri(uri)) {
    const mime = uri.match(/^data:([^;]+);/)?.[1] || 'image/png';
    const map: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
      'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'video/quicktime': 'mov',
      'application/pdf': 'pdf',
    };
    return map[mime] || 'bin';
  }
  const clean = uri.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  if (parts.length < 2) return 'jpg';
  const ext = parts.pop()?.toLowerCase() || 'jpg';
  const valid = ['png','jpg','jpeg','webp','gif','mp4','mov','pdf'];
  return valid.includes(ext) ? ext : 'bin';
}

function dataUriToBlob(dataUri: string): Blob {
  const mime = dataUri.match(/^data:([^;]+);/)?.[1] || 'application/octet-stream';
  const base64 = dataUri.split(',')[1];
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mime });
}

export async function uploadFile(uri: string, options: UploadOptions): Promise<UploadResult> {
  const { bucket, folder = '', userId, fileName: customName, contentType, upsert = true } = options;
  if (!uri) throw new Error('No file URI provided');
  if (!userId) throw new Error('userId is required');

  const ext = getExtensionFromUri(uri);
  const mime = contentType || (isBase64DataUri(uri)
    ? (uri.match(/^data:([^;]+);/)?.[1] || 'application/octet-stream')
    : 'application/octet-stream');
  const name = customName || `${Date.now()}`;
  const storagePath = folder ? `${folder}/${userId}/${name}.${ext}` : `${userId}/${name}.${ext}`;

  let fileData: File | Blob | ArrayBuffer;
  if (isBase64DataUri(uri)) {
    fileData = dataUriToBlob(uri);
  } else if (Platform.OS === 'web') {
    fileData = await (await fetch(uri)).blob();
  } else {
    fileData = await (await fetch(uri)).arrayBuffer();
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket).upload(storagePath, fileData, { contentType: mime, upsert });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!urlData?.publicUrl) throw new Error('Failed to generate public URL');

  return { publicUrl: urlData.publicUrl, path: storagePath, bucket };
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
