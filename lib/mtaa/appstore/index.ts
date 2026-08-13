// @ts-nocheck
import * as ALL_APPS from '@/lib/mtaa/appstore/unified-registry';
import type { AppManifest as UnifiedAppManifest } from '@/lib/mtaa/appstore/unified-registry';

export { ALL_APPS };
export type { UnifiedAppManifest };

export function getAppById(id: string): UnifiedAppManifest | undefined {
  return (ALL_APPS as any).default?.find?.((a: any) => a.id === id) || (ALL_APPS as any).find?.((a: any) => a.id === id);
}

export function getAppsByCategory(category: string): UnifiedAppManifest[] {
  const apps = (ALL_APPS as any).default || ALL_APPS || [];
  return (Array.isArray(apps) ? apps : Object.values(apps)).filter((a: any) => a.category === category);
}

export function searchApps(query: string): UnifiedAppManifest[] {
  const apps = (ALL_APPS as any).default || ALL_APPS || [];
  const q = query.toLowerCase();
  return (Array.isArray(apps) ? apps : Object.values(apps)).filter((a: any) =>
    a.name?.toLowerCase().includes(q) ||
    a.description?.toLowerCase().includes(q) ||
    a.developer?.toLowerCase().includes(q)
  );
}
