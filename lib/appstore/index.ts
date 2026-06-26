// lib/appstore/index.ts
import { create } from 'zustand';
import { AppManifest } from './types';
export type { AppManifest } from './types';

interface AppStoreState {
  installedApps: AppManifest[];
  currentApp: AppManifest | null;
  isLoading: boolean;
  setInstalledApps: (apps: AppManifest[]) => void;
  addInstalledApp: (app: AppManifest) => void;
  removeInstalledApp: (appId: string) => void;
  setCurrentApp: (app: AppManifest | null) => void;
  setLoading: (loading: boolean) => void;
  isAppInstalled: (appId: string) => boolean;
  getInstalledApp: (appId: string) => AppManifest | undefined;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  installedApps: [],
  currentApp: null,
  isLoading: false,
  setInstalledApps: (apps) => set({ installedApps: apps }),
  addInstalledApp: (app) => {
    const { installedApps } = get();
    if (!installedApps.find((a) => a.id === app.id)) {
      set({ installedApps: [...installedApps, app] });
    }
  },
  removeInstalledApp: (appId) => {
    set({ installedApps: get().installedApps.filter((a) => a.id !== appId) });
  },
  setCurrentApp: (app) => set({ currentApp: app }),
  setLoading: (loading) => set({ isLoading: loading }),
  isAppInstalled: (appId) => get().installedApps.some((a) => a.id === appId),
  getInstalledApp: (appId) => get().installedApps.find((a) => a.id === appId),
}));

let _registry: AppManifest[] | null = null;

export async function loadRegistry(): Promise<AppManifest[]> {
  if (_registry) return _registry;
  try {
    const { getAllApps } = await import('@/lib/mtaa/appstore/unified-registry');
    _registry = getAllApps();
    return _registry;
  } catch {
    _registry = loadLocalManifests();
    return _registry;
  }
}

export function getAppById(id: string): AppManifest | undefined {
  if (_registry) return _registry.find((app) => app.id === id);
  const local = loadLocalManifests();
  return local.find((app) => app.id === id);
}

export function getAppsByCategory(category: string): AppManifest[] {
  const registry = _registry || loadLocalManifests();
  return registry.filter((app) => app.category === category);
}

export function getOSApps(): AppManifest[] {
  const registry = _registry || loadLocalManifests();
  return registry.filter((app) => app.isOSApp === true);
}

export function getThirdPartyApps(): AppManifest[] {
  const registry = _registry || loadLocalManifests();
  return registry.filter((app) => app.isOSApp !== true);
}

function loadLocalManifests(): AppManifest[] {
  const manifests: AppManifest[] = [];
  try { const b = require('./apps/border.manifest'); manifests.push(b.default || b.manifest || b); } catch {}
  try { const c = require('./apps/customs.manifest'); manifests.push(c.default || c.manifest || c); } catch {}
  try { const i = require('./apps/immigration.manifest'); manifests.push(i.default || i.manifest || i); } catch {}
  return manifests;
}

export async function installApp(appId: string): Promise<boolean> {
  const store = useAppStore.getState();
  const app = getAppById(appId);
  if (!app) return false;
  if (store.isAppInstalled(appId)) return true;
  store.addInstalledApp(app);
  return true;
}

export async function uninstallApp(appId: string): Promise<boolean> {
  useAppStore.getState().removeInstalledApp(appId);
  return true;
}

export async function launchApp(appId: string): Promise<boolean> {
  const app = getAppById(appId);
  if (!app) return false;
  useAppStore.getState().setCurrentApp(app);
  return true;
}
