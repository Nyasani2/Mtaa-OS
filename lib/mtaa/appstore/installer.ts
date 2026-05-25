// lib/mtaa/appstore/installer.ts
import { getAppById } from './registry';
import { supabase } from '@/lib/supabase/client';
import type { AppManifest, InstalledApp } from '@/types/module.types';

const installedApps = new Map<string, InstalledApp>();

export async function installApp(appId: string): Promise<{ status: string; app: InstalledApp }> {
  const manifest = getAppById(appId);
  if (!manifest) throw new Error('APP_NOT_FOUND');

  const { error } = await supabase.from('installed_apps').upsert({
    app_id: appId,
    version: manifest.version,
    installed_at: new Date().toISOString(),
    is_active: true,
  }, { onConflict: 'app_id' });

  if (error) {
    console.error('[Installer] Supabase error:', error.message);
  }

  const installed: InstalledApp = {
    manifest,
    installDate: new Date().toISOString(),
    isActive: true,
  };
  installedApps.set(appId, installed);

  return { status: 'INSTALLED', app: installed };
}

export async function uninstallApp(appId: string): Promise<{ status: string; appId: string }> {
  const { error } = await supabase.from('installed_apps').delete().eq('app_id', appId);
  if (error) console.error('[Uninstaller] Supabase error:', error.message);

  installedApps.delete(appId);
  return { status: 'REMOVED', appId };
}

export function getInstalledApps(): InstalledApp[] {
  return Array.from(installedApps.values());
}

export function isAppInstalled(appId: string): boolean {
  return installedApps.has(appId);
}
