import { supabase } from '@/lib/supabase';

export type AppStoreAction = 'manifest_sync' | 'install_app' | 'publish' | 'approve' | 'subscribe';

export interface AppStoreManifestSyncParams {
  action: 'manifest_sync';
  appId?: string;
  force?: boolean;
}

export interface AppStoreInstallParams {
  action: 'install_app';
  appId: string;
  userId: string;
  deviceId: string;
  version?: string;
}

export interface AppStorePublishParams {
  action: 'publish';
  developerId: string;
  appData: {
    name: string; description: string; category: string;
    icon: string; screenshots: string[]; version: string;
    price: number; permissions: string[];
  };
  sourceCode: string;
}

export interface AppStoreApproveParams {
  action: 'approve';
  appId: string;
  reviewerId: string;
  status: 'approved' | 'rejected' | 'pending';
  notes?: string;
}

export interface AppStoreSubscribeParams {
  action: 'subscribe';
  appId: string;
  userId: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  paymentMethod?: 'wallet' | 'mpesa';
}

export type AppStoreParams = 
  | AppStoreManifestSyncParams | AppStoreInstallParams | AppStorePublishParams
  | AppStoreApproveParams | AppStoreSubscribeParams;

export async function appstoreOperation(params: AppStoreParams) {
  const { data, error } = await supabase.functions.invoke('appstore-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const syncManifest = (p: Omit<AppStoreManifestSyncParams, 'action'>) => 
  appstoreOperation({ action: 'manifest_sync', ...p } as AppStoreManifestSyncParams);

export const installApp = (p: Omit<AppStoreInstallParams, 'action'>) => 
  appstoreOperation({ action: 'install_app', ...p } as AppStoreInstallParams);

export const publishApp = (p: Omit<AppStorePublishParams, 'action'>) => 
  appstoreOperation({ action: 'publish', ...p } as AppStorePublishParams);

export const approveApp = (p: Omit<AppStoreApproveParams, 'action'>) => 
  appstoreOperation({ action: 'approve', ...p } as AppStoreApproveParams);

export const subscribeApp = (p: Omit<AppStoreSubscribeParams, 'action'>) => 
  appstoreOperation({ action: 'subscribe', ...p } as AppStoreSubscribeParams);
