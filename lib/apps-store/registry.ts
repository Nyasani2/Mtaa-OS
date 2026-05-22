import { MTAXI_APP } from "./apps/mtaxi/manifest";
import { MTRUCK_APP } from "./apps/mtruck/manifest";
import { HOOKUP_APP } from "./apps/hookup/manifest";
import { HEALTH_APP } from "./apps/health/manifest";
import { WALLET_APP } from "./apps/wallet/manifest";
import { SETTINGS_APP } from "./apps/settings/manifest";
import { CREDIT_APP } from "./apps/credit/manifest";
import { JOBS_APP } from "./apps/jobs/manifest";
import { MARKETPLACE_APP } from "./apps/marketplace/manifest";
import { SHOP_APP } from "./apps/shop/manifest";
import { STREETS_APP } from "./apps/streets/manifest";
import { TRIBES_APP } from "./apps/tribes/manifest";
import { EDUCATION_APP } from "./apps/education/manifest";
import { CIVIC_APP } from "./apps/civic/manifest";
import { DOCUMENTS_APP } from "./apps/documents/manifest";
import { GALLERY_APP } from "./apps/gallery/manifest";
import { MESSAGES_APP } from "./apps/messages/manifest";
import { CLOCK_APP } from "./apps/clock/manifest";
import { SCHEDULER_APP } from "./apps/scheduler/manifest";
import { SIM_APP } from "./apps/sim/manifest";
import { RECENTS_APP } from "./apps/recents/manifest";
import { BINANCE_APP } from "./apps/binance/manifest";
import { ADS_APP } from "./apps/ads/manifest";
import { ANALYTICS_APP } from "./apps/analytics/manifest";
import { POLICE_APP } from "./apps/police/manifest";
import { COURTS_APP } from "./apps/courts/manifest";
import { PRISONS_APP } from "./apps/prisons/manifest";
import { REVENUE_APP } from "./apps/revenue/manifest";
import { HEALTH_AUTHORITY_APP } from "./apps/health-authority/manifest";

// ============================================
// UNIFIED APP REGISTRY — ALL 24 APPS
// NO apps in OS shell. All install from AppStore.
// ============================================

// Core apps (recommended, not forced)
const CORE_APPS = [
  HEALTH_APP,
  WALLET_APP,
  SETTINGS_APP,
];

// Local installable apps (bundled with OS)
const LOCAL_APPS = [
  MTAXI_APP,
  MTRUCK_APP,
  HOOKUP_APP,
  CREDIT_APP,
  JOBS_APP,
  MARKETPLACE_APP,
  SHOP_APP,
  STREETS_APP,
  TRIBES_APP,
  EDUCATION_APP,
  CIVIC_APP,
  DOCUMENTS_APP,
  GALLERY_APP,
  MESSAGES_APP,
  CLOCK_APP,
  SCHEDULER_APP,
  SIM_APP,
  RECENTS_APP,
  BINANCE_APP,
  ADS_APP,
  ANALYTICS_APP,
];

let remoteApps: any[] = [];
export function setRemoteApps(apps: any[]) { remoteApps = apps; }
export function getRemoteApps() { return remoteApps; }

export function getUnifiedRegistry() {
  return [
    ...CORE_APPS.map(app => ({ ...app, isCore: true, isSystem: false, isLocal: true })),
    ...LOCAL_APPS.map(app => ({ ...app, isCore: false, isSystem: false, isLocal: true })),
    ...remoteApps.map((app: any) => ({ ...app, isCore: false, isSystem: false, isLocal: false })),
  ];
}

export function getInstalledApps() {
  return getUnifiedRegistry().filter(app => app.isCore || app.isLocal);
}
