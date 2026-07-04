// lib/mtaa/appstore/apps/types.ts
// Re-exports from canonical type sources

export type { AppPermission, AppManifest, InstalledApp, ModuleManifest } from '@/types/module.types';

// Additional types used by appstore
export interface AppRegistryEntry {
  id: string;
  name: string;
  route: string;
  icon: string;
  category: string;
  enabled: boolean;
  requiresAuth: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  category: string;
}
