// @ts-nocheck
// lib/appstore/index.ts — Re-export from unified registry with correct types
import * as ALL_APPS from '@/lib/mtaa/appstore/unified-registry';
import type { AppManifest as UnifiedAppManifest } from '@/lib/mtaa/appstore/unified-registry';

// Re-export with compatible type (unified registry uses entry_route, old uses entryPoint/route)
export interface AppManifest {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  entryPoint: string;
  route?: string;
  isSystem: boolean;
  isInstalled: boolean;
  version: string;
  developer: string;
  permissions: string[];
  size: number;
  rating: number;
  downloads: number;
  tags: string[];
  isOSCore?: boolean;
}

export function getAllApps(): AppManifest[] {
  return ALL_APPS.map((a: any) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    category: a.category,
    icon: a.icon,
    entryPoint: a.entry_route,
    route: a.entry_route,
    isSystem: a.is_system_app,
    isInstalled: a.is_installed,
    version: a.version,
    developer: a.developer,
    permissions: a.permissions,
    size: a.size_mb,
    rating: a.rating,
    downloads: a.review_count,
    tags: [],
    isOSCore: a.is_system_app,
  }));
}

export function getInstalledApps(): AppManifest[] {
  return getAllApps().filter((a: any) => a.isInstalled || a.isSystem);
}

export function getAppById(id: string): AppManifest | undefined {
  return getAllApps().find((a: any) => a.id === id);
}

export { ALL_APPS as appRegistry };
export type { UnifiedAppManifest };
