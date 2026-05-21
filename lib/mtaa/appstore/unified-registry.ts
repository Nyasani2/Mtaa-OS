// lib/mtaa/appstore/unified-registry.ts
import { tribesManifest } from './tribes-manifest';
import { educationManifest } from './education-manifest';
import { civicManifest } from './civic-manifest';
import { healthManifest } from './health-manifest';
import { streetsManifest } from './streets-manifest';
import { analyticsManifest } from './analytics-manifest';

export interface AppManifest {
  id: string; name: string; version: string; icon: string; category: string;
  description: string; entryRoute: string; permissions: string[];
  minKycLevel: number; sizeMb: number; dependencies: string[]; enabled: boolean;
}

const REGISTRY: Record<string, AppManifest> = {
  tribes: tribesManifest, education: educationManifest, civic: civicManifest,
  health: healthManifest, streets: streetsManifest, analytics: analyticsManifest,
};

class UnifiedRegistry {
  getApp(id: string): AppManifest|undefined { return REGISTRY[id]; }
  getAllApps(): AppManifest[] { return Object.values(REGISTRY).filter(app => app.enabled); }
  getByCategory(category: string): AppManifest[] { return this.getAllApps().filter(app => app.category === category); }
  getByKycLevel(kycLevel: number): AppManifest[] { return this.getAllApps().filter(app => app.minKycLevel <= kycLevel); }
  isAvailable(id: string, userKycLevel: number): boolean {
    const app = this.getApp(id); return !!app && app.enabled && app.minKycLevel <= userKycLevel;
  }
}
export const unifiedRegistry = new UnifiedRegistry();
