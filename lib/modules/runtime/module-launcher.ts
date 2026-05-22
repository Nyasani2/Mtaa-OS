import type { LauncherApp, ModuleId } from "./module.types";
import { useModuleStore } from "./module-store";

/**
 * Launcher authority — returns only launcher-safe apps.
 * Excludes: hidden apps, disabled apps, suspended apps, uninstalled apps.
 * No hardcoded apps. Registry-driven only.
 */

export function getLauncherApps(): LauncherApp[] {
  return useModuleStore.getState().getLauncherApps();
}

export function getPinnedApps(): LauncherApp[] {
  return getLauncherApps().filter((app) => app.pinned);
}

export function getRecentApps(limit = 5): LauncherApp[] {
  const store = useModuleStore.getState();
  return Object.values(store.modules)
    .filter((m) => m.lastOpenedAt && m.lifecycle !== "uninstalled")
    .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
    .slice(0, limit)
    .map((m) => ({
      id: m.manifest.id,
      name: m.manifest.name,
      icon: m.manifest.icon,
      color: m.manifest.color,
      route: m.manifest.route,
      category: m.manifest.category,
    }));
}

export function getAppsByCategory(category: string): LauncherApp[] {
  return getLauncherApps().filter((app) => app.category === category);
}

export function getAppCategories(): string[] {
  const apps = getLauncherApps();
  return Array.from(new Set(apps.map((a) => a.category)));
}

export function searchLauncherApps(query: string): LauncherApp[] {
  const q = query.toLowerCase();
  return getLauncherApps().filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
  );
}

export function isAppLaunchable(moduleId: ModuleId): boolean {
  const store = useModuleStore.getState();
  const mod = store.modules[moduleId];
  if (!mod) return false;
  if (mod.lifecycle !== "installed" && mod.lifecycle !== "enabled") return false;
  if (mod.manifest.visibility === "private") return false;
  if (mod.manifest.enabled === false) return false;
  return true;
}

export function recordAppOpen(moduleId: ModuleId): void {
  useModuleStore.getState().recordOpen(moduleId);
}

export default {
  getLauncherApps,
  getPinnedApps,
  getRecentApps,
  getAppsByCategory,
  getAppCategories,
  searchLauncherApps,
  isAppLaunchable,
  recordAppOpen,
};
