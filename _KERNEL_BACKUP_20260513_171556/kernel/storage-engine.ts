/**
 * MTAA Storage Engine
 * File uploads, CDN, scoped access, bucket management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StorageConfig {
  maxFileSize: number;
  allowedTypes: string[];
  bucket: string;
  pathPrefix?: string;
  publicAccess: boolean;
  cdnEnabled: boolean;
  virusScan: boolean;
  watermark?: boolean;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  path: string;
  publicUrl: string;
  cdnUrl?: string;
  size: number;
  mimeType: string;
  metadata: Record<string, any>;
  error?: string;
}

export interface StorageQuota {
  usedBytes: number;
  totalBytes: number;
  fileCount: number;
  bucketCount: number;
}

export const STORAGE_BUCKETS = {
  PUBLIC: 'public-assets',
  PRIVATE: 'private-files',
  AVATARS: 'user-avatars',
  DOCUMENTS: 'kyc-documents',
  MEDIA: 'media-streams',
  BACKUPS: 'system-backups',
  TEMP: 'temp-uploads',
  APP_ASSETS: 'app-assets',
  INVOICES: 'invoices',
  RECEIPTS: 'receipts',
} as const;

export const DEFAULT_CONFIGS: Record<string, StorageConfig> = {
  [STORAGE_BUCKETS.PUBLIC]: {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/*', 'video/*', 'application/pdf'],
    bucket: STORAGE_BUCKETS.PUBLIC,
    publicAccess: true, cdnEnabled: true, virusScan: false,
  },
  [STORAGE_BUCKETS.PRIVATE]: {
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['*/*'],
    bucket: STORAGE_BUCKETS.PRIVATE,
    publicAccess: false, cdnEnabled: false, virusScan: true,
  },
  [STORAGE_BUCKETS.AVATARS]: {
    maxFileSize: 2 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    bucket: STORAGE_BUCKETS.AVATARS,
    publicAccess: true, cdnEnabled: true, virusScan: false, watermark: false,
  },
  [STORAGE_BUCKETS.DOCUMENTS]: {
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/*'],
    bucket: STORAGE_BUCKETS.DOCUMENTS,
    publicAccess: false, cdnEnabled: false, virusScan: true,
  },
  [STORAGE_BUCKETS.MEDIA]: {
    maxFileSize: 500 * 1024 * 1024,
    allowedTypes: ['video/*', 'audio/*'],
    bucket: STORAGE_BUCKETS.MEDIA,
    publicAccess: true, cdnEnabled: true, virusScan: false,
  },
  [STORAGE_BUCKETS.TEMP]: {
    maxFileSize: 100 * 1024 * 1024,
    allowedTypes: ['*/*'],
    bucket: STORAGE_BUCKETS.TEMP,
    publicAccess: false, cdnEnabled: false, virusScan: false,
  },
};

export class StorageEngine {
  private client: SupabaseClient;
  private cdnBaseUrl: string;

  constructor(supabaseUrl: string, supabaseKey: string, cdnBaseUrl?: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.cdnBaseUrl = cdnBaseUrl || supabaseUrl.replace('.supabase.co', '.cdn.supabase.co');
  }

  async createBucket(bucketId: string, config: Partial<StorageConfig> = {}): Promise<boolean> {
    const { data: existing } = await this.client.storage.getBucket(bucketId);
    if (existing) return true;
    const { error } = await this.client.storage.createBucket(bucketId, {
      public: config.publicAccess ?? false,
      fileSizeLimit: config.maxFileSize,
      allowedMimeTypes: config.allowedTypes,
    });
    if (error) { console.error('[Storage] Bucket creation failed:', error.message); return false; }
    await this.client.rpc('storage_create_bucket_policy', { p_bucket: bucketId, p_public: config.publicAccess ?? false });
    return true;
  }

  async listBuckets(): Promise<string[]> {
    const { data, error } = await this.client.storage.listBuckets();
    if (error) { console.error('[Storage] List buckets failed:', error.message); return []; }
    return data.map(b => b.name);
  }

  async deleteBucket(bucketId: string): Promise<boolean> {
    const { error } = await this.client.storage.deleteBucket(bucketId);
    if (error) { console.error('[Storage] Delete bucket failed:', error.message); return false; }
    return true;
  }

  async uploadFile(bucketId: string, file: File | Blob, fileName: string, options: { userId?: string; appId?: string; metadata?: Record<string, any>; pathPrefix?: string; onProgress?: (progress: number) => void; } = {}): Promise<UploadResult> {
    const config = DEFAULT_CONFIGS[bucketId] || DEFAULT_CONFIGS[STORAGE_BUCKETS.PRIVATE];
    if (file.size > config.maxFileSize) return { success: false, fileId: '', path: '', publicUrl: '', size: file.size, mimeType: file.type, metadata: {}, error: `File exceeds max size of ${this.formatBytes(config.maxFileSize)}` };
    if (config.allowedTypes[0] !== '*/*') {
      const isAllowed = config.allowedTypes.some(type => type.endsWith('/*') ? file.type.startsWith(type.replace('/*', '')) : file.type === type);
      if (!isAllowed) return { success: false, fileId: '', path: '', publicUrl: '', size: file.size, mimeType: file.type, metadata: {}, error: `File type ${file.type} not allowed. Allowed: ${config.allowedTypes.join(', ')}` };
    }
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const prefix = options.pathPrefix || (options.userId ? `users/${options.userId}` : 'anonymous');
    const path = `${prefix}/${timestamp}-${safeName}`;
    const { error } = await this.client.storage.from(bucketId).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) return { success: false, fileId: '', path: '', publicUrl: '', size: file.size, mimeType: file.type, metadata: {}, error: error.message };
    const { data: urlData } = this.client.storage.from(bucketId).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const cdnUrl = config.cdnEnabled ? publicUrl.replace(this.client.supabaseUrl, this.cdnBaseUrl) : undefined;
    const fileId = crypto.randomUUID();
    const { error: dbError } = await this.client.from('storage_files').insert({ id: fileId, bucket_id: bucketId, path, filename: fileName, size: file.size, mime_type: file.type, owner_id: options.userId || null, app_id: options.appId || null, public_url: publicUrl, cdn_url: cdnUrl, metadata: options.metadata || {}, is_public: config.publicAccess, virus_scanned: !config.virusScan, scan_status: config.virusScan ? 'pending' : 'clean' });
    if (dbError) console.error('[Storage] DB record failed:', dbError.message);
    if (options.userId) await this.logAccess(fileId, options.userId, 'write');
    return { success: true, fileId, path, publicUrl, cdnUrl, size: file.size, mimeType: file.type, metadata: options.metadata || {} };
  }

  async getSignedUrl(bucketId: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    const { data, error } = await this.client.storage.from(bucketId).createSignedUrl(path, expiresIn);
    if (error) { console.error('[Storage] Signed URL failed:', error.message); return null; }
    return data.signedUrl;
  }

  async getFile(fileId: string, requesterId?: string): Promise<UploadResult | null> {
    const { data, error } = await this.client.from('storage_files').select('*').eq('id', fileId).single();
    if (error || !data) return null;
    if (!data.is_public && requesterId) { const hasAccess = await this.checkPermission(fileId, requesterId, 'read'); if (!hasAccess) return null; }
    if (requesterId) await this.logAccess(fileId, requesterId, 'read');
    return { success: true, fileId: data.id, path: data.path, publicUrl: data.public_url, cdnUrl: data.cdn_url, size: data.size, mimeType: data.mime_type, metadata: data.metadata };
  }

  async grantPermission(fileId: string, grantedTo: string, permission: 'read' | 'write' | 'admin', expiresAt?: Date): Promise<boolean> {
    const { error } = await this.client.from('storage_permissions').insert({ file_id: fileId, granted_to: grantedTo, permission, expires_at: expiresAt?.toISOString() || null });
    if (error) { console.error('[Storage] Grant permission failed:', error.message); return false; }
    return true;
  }

  async revokePermission(fileId: string, grantedTo: string): Promise<boolean> {
    const { error } = await this.client.from('storage_permissions').delete().eq('file_id', fileId).eq('granted_to', grantedTo);
    if (error) { console.error('[Storage] Revoke permission failed:', error.message); return false; }
    return true;
  }

  async checkPermission(fileId: string, userId: string, required: 'read' | 'write' | 'admin'): Promise<boolean> {
    const { data: file } = await this.client.from('storage_files').select('owner_id').eq('id', fileId).single();
    if (file?.owner_id === userId) return true;
    const { data: perms } = await this.client.from('storage_permissions').select('*').eq('file_id', fileId).eq('granted_to', userId).or('expires_at.is.null,expires_at.gt.now()');
    if (!perms || perms.length === 0) return false;
    const hierarchy = { read: 1, write: 2, admin: 3 };
    return perms.some(p => hierarchy[p.permission] >= hierarchy[required]);
  }

  async deleteFile(fileId: string, requesterId: string): Promise<boolean> {
    const file = await this.getFile(fileId, requesterId);
    if (!file) return false;
    const { data: dbFile } = await this.client.from('storage_files').select('bucket_id, path').eq('id', fileId).single();
    if (!dbFile) return false;
    const { error: storageError } = await this.client.storage.from(dbFile.bucket_id).remove([dbFile.path]);
    if (storageError) { console.error('[Storage] Delete from storage failed:', storageError.message); return false; }
    await this.client.from('storage_files').delete().eq('id', fileId);
    await this.client.from('storage_permissions').delete().eq('file_id', fileId);
    await this.logAccess(fileId, requesterId, 'delete');
    return true;
  }

  async moveFile(fileId: string, newBucket: string, newPath: string, requesterId: string): Promise<boolean> {
    const file = await this.getFile(fileId, requesterId);
    if (!file) return false;
    const { data: dbFile } = await this.client.from('storage_files').select('bucket_id, path').eq('id', fileId).single();
    if (!dbFile) return false;
    const { error } = await this.client.storage.from(dbFile.bucket_id).move(dbFile.path, newPath);
    if (error) { console.error('[Storage] Move failed:', error.message); return false; }
    await this.client.from('storage_files').update({ bucket_id: newBucket, path: newPath }).eq('id', fileId);
    return true;
  }

  async getUserQuota(userId: string): Promise<StorageQuota> {
    const { data, error } = await this.client.from('storage_files').select('size').eq('owner_id', userId);
    if (error || !data) return { usedBytes: 0, totalBytes: 1073741824, fileCount: 0, bucketCount: 0 };
    const usedBytes = data.reduce((sum, f) => sum + (f.size || 0), 0);
    const { data: profile } = await this.client.from('profiles').select('storage_quota_bytes').eq('id', userId).single();
    const totalBytes = profile?.storage_quota_bytes || 1073741824;
    const { data: buckets } = await this.client.from('storage_files').select('bucket_id', { count: 'exact', head: true }).eq('owner_id', userId);
    return { usedBytes, totalBytes, fileCount: data.length, bucketCount: buckets?.length || 0 };
  }

  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; byBucket: Record<string, { count: number; size: number }>; }> {
    const { data, error } = await this.client.from('storage_files').select('bucket_id, size');
    if (error || !data) return { totalFiles: 0, totalSize: 0, byBucket: {} };
    const byBucket: Record<string, { count: number; size: number }> = {};
    data.forEach(f => { if (!byBucket[f.bucket_id]) byBucket[f.bucket_id] = { count: 0, size: 0 }; byBucket[f.bucket_id].count++; byBucket[f.bucket_id].size += f.size || 0; });
    return { totalFiles: data.length, totalSize: data.reduce((sum, f) => sum + (f.size || 0), 0), byBucket };
  }

  private async logAccess(fileId: string, userId: string, accessType: 'read' | 'write' | 'delete' | 'share'): Promise<void> {
    await this.client.from('storage_access_logs').insert({ file_id: fileId, accessed_by: userId, access_type: accessType });
  }

  async getAccessLogs(fileId: string) {
    const { data, error } = await this.client.from('storage_access_logs').select('*').eq('file_id', fileId).order('created_at', { ascending: false });
    if (error) { console.error('[Storage] Access logs failed:', error.message); return []; }
    return data || [];
  }

  async cleanupTempFiles(maxAgeHours: number = 24): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const { data: oldFiles } = await this.client.from('storage_files').select('id, bucket_id, path').eq('bucket_id', STORAGE_BUCKETS.TEMP).lt('created_at', cutoff);
    if (!oldFiles || oldFiles.length === 0) return 0;
    let deleted = 0;
    for (const file of oldFiles) { if (await this.deleteFile(file.id, 'system')) deleted++; }
    return deleted;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

let engineInstance: StorageEngine | null = null;

export function getStorageEngine(): StorageEngine {
  if (!engineInstance) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const cdn = process.env.NEXT_PUBLIC_CDN_URL;
    engineInstance = new StorageEngine(url, key, cdn);
  }
  return engineInstance;
}

export { StorageEngine };
