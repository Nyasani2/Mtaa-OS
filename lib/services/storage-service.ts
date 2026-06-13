import { supabase } from '@/lib/supabase';

export type StorageAction = 'upload' | 'scan' | 'list';

export interface StorageUploadParams {
  action: 'upload';
  bucket: string;
  path: string;
  file: File | Blob;
  contentType?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageScanParams {
  action: 'scan';
  bucket: string;
  path: string;
  scanType: 'virus' | 'malware' | 'content';
}

export interface StorageListParams {
  action: 'list';
  bucket: string;
  path?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'name' | 'created' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export type StorageParams = StorageUploadParams | StorageScanParams | StorageListParams;

export async function storageOperation(params: StorageParams) {
  const { data, error } = await supabase.functions.invoke('storage-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const uploadFile = (p: Omit<StorageUploadParams, 'action'>) => 
  storageOperation({ action: 'upload', ...p } as StorageUploadParams);

export const scanFile = (p: Omit<StorageScanParams, 'action'>) => 
  storageOperation({ action: 'scan', ...p } as StorageScanParams);

export const listFiles = (p: Omit<StorageListParams, 'action'>) => 
  storageOperation({ action: 'list', ...p } as StorageListParams);
