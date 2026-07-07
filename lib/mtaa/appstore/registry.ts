import { AppManifest } from '@/types/module.types';
import { garageManifest } from './apps/garage/manifest';

const appRegistry = new Map<string, AppManifest>();

export function getAppStoreRegistry(): Map<string, AppManifest> {
  return appRegistry;
}

export function registerAppStoreApp(manifest: AppManifest): void {
  appRegistry.set(manifest.id, manifest);
}

export function unregisterAppStoreApp(id: string): boolean {
  return appRegistry.delete(id);
}

// Register Garage OS
registerAppStoreApp(garageManifest);
