import type { AppManifest } from '@/types/module.types';

export function getRegistryEntries(): any[] {
  return [];
}

export function registerApp(manifest: AppManifest) {
  return manifest;
}

// Augment AppManifest interface globally
declare module '@/types/module.types' {
  interface AppManifest {
    isLocalApp?: boolean;
  }
}
