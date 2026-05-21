import { MTRUCK_APP } from "./apps/mtruck/manifest";
import { HOOKUP_APP } from "./apps/hookup/manifest";
import { HEALTH_APP } from "./apps/health/manifest";
import { WALLET_APP } from "./apps/wallet/manifest";
import { SETTINGS_APP } from "./apps/settings/manifest";
import { CREDIT_APP } from "./apps/credit/manifest";
import { JOBS_APP } from "./apps/jobs/manifest";
import { MARKETPLACE_APP } from "./apps/marketplace/manifest";
import { STREETS_APP } from "./apps/streets/manifest";
import { MTAXI_APP } from "./apps/mtaxi/manifest";
import { TRIBES_APP } from "./apps/tribes/manifest";
// ============================================
// UNIFIED APP REGISTRY — PHASE 1 COMPLETE
// 9 apps total: 3 system + 6 installable
// ============================================

// System apps (pre-installed, cannot uninstall)
const SYSTEM_APPS = [
  HEALTH_APP,
  WALLET_APP,
  SETTINGS_APP,
];

// Local installable apps (bundled with OS)
const LOCAL_APPS = [
  MTRUCK_APP,
  HOOKUP_APP,
  CREDIT_APP,
  JOBS_APP,
  MARKETPLACE_APP,
  STREETS_APP,
TRIBES_APP, 
];

// Remote apps fetched from Supabase app_store_apps table
let remoteApps: any[] = [];

export function setRemoteApps(apps: any[]) {
  remoteApps = apps;
}

export function getRemoteApps() {
  return remoteApps;
}

// Full unified registry
export function getUnifiedRegistry() {
  return [
    ...SYSTEM_APPS.map(app => ({ ...app, isSystem: true })),
    ...LOCAL_APPS.map(app => ({ ...app, isSystem: false, isLocal: true })),
    ...remoteApps.map((app: any) => ({ ...app, isSystem: false, isLocal: false })),
  ];
}

// Legacy export for backward compatibility
export const APP_REGISTRY = LOCAL_APPS;

export function getAppById(id: string) {
  const all = getUnifiedRegistry();
  return all.find(app => app.id === id);
}

export function listApps() {
  return getUnifiedRegistry().filter(app => app.installable);
}

export function listSystemApps() {
  return SYSTEM_APPS;
}

export function listLocalApps() {
  return LOCAL_APPS;
}

export function listInstallableApps() {
  return getUnifiedRegistry().filter(app => app.installable && !app.isSystem);
}

export function isSystemApp(id: string) {
  return SYSTEM_APPS.some(app => app.id === id);
}

export function isLocalApp(id: string) {
  return LOCAL_APPS.some(app => app.id === id);
}
