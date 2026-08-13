import type { AppManifest, InstalledApp } from '@/types/module.types';

export function installApp(manifest: AppManifest): InstalledApp {
  return {
    id: manifest.id,
    version: manifest.version,
    manifest,
    installedAt: new Date().toISOString(),
    isActive: true,
  } as InstalledApp;
}
