// lib/mtaa/appstore/registry.ts
import { AppManifest } from '@/types/module.types';

const appRegistry = new Map<string, AppManifest>();

export function getAppById(id: string): AppManifest | undefined {
  return appRegistry.get(id);
}

export function isSystemApp(id: string): boolean {
  return appRegistry.get(id)?.isSystemApp ?? false;
}

export function isLocalApp(id: string): boolean {
  return appRegistry.get(id)?.isLocalApp ?? false;
}

export function listApps(): AppManifest[] {
  return Array.from(appRegistry.values());
}

export function registerAppStoreApp(manifest: AppManifest): void {
  appRegistry.set(manifest.id, manifest);
}

export function unregisterAppStoreApp(id: string): boolean {
  return appRegistry.delete(id);
}
