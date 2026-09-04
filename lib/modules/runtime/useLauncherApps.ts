import { useMemo, useCallback } from 'react';
import { useModuleStore } from "./module-store";
import { getLauncherApps, getRecentApps, recordAppOpen } from "./module-launcher";
import type { LauncherApp, ModuleId } from "./module.types";

/**
 * Hook: useLauncherApps
 * Returns launcher-safe apps with categories, recents, and search.
 */

export interface UseLauncherAppsOptions {
  category?: string;
  pinnedOnly?: boolean;
  search?: string;
  includeRecents?: boolean;
  recentLimit?: number;
}

export function useLauncherApps(options: UseLauncherAppsOptions = {}) {
  const modules = useModuleStore((state) => state.modules);

  const apps = useMemo(() => {
    let result = getLauncherApps();

    if (options.category) {
      result = result.filter((app) => app.category === options.category);
    }

    if (options.pinnedOnly) {
      result = result.filter((app) => app.pinned);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [modules, options.category, options.pinnedOnly, options.search]);

  const recents = useMemo(() => {
    if (!options.includeRecents) return [];
    return getRecentApps(options.recentLimit || 5);
  }, [modules, options.includeRecents, options.recentLimit]);

  const categories = useMemo(() => {
    const cats = new Map<string, { id: string; name: string; count: number }>();
    apps.forEach((app) => {
      const existing = cats.get(app.category);
      if (existing) {
        existing.count++;
      } else {
        cats.set(app.category, {
          id: app.category,
          name: app.category.charAt(0).toUpperCase() + app.category.slice(1),
          count: 1,
        });
      }
    });
    return Array.from(cats.values()).sort((a, b) => b.count - a.count);
  }, [apps]);

  const launchApp = useCallback((moduleId: ModuleId) => {
    recordAppOpen(moduleId);
    const mod = modules[moduleId];
    return mod?.manifest.route || null;
  }, [modules]);

  return {
    apps,
    recents,
    categories,
    launchApp,
    totalApps: apps.length,
  };
}

export function useAppCategories() {
  const apps = useMemo(() => getLauncherApps(), []);
  return useMemo(() => {
    const cats = new Map<string, { id: string; name: string; apps: LauncherApp[] }>();
    apps.forEach((app) => {
      if (!cats.has(app.category)) {
        cats.set(app.category, {
          id: app.category,
          name: app.category.charAt(0).toUpperCase() + app.category.slice(1),
          apps: [],
        });
      }
      cats.get(app.category)!.apps.push(app);
    });
    return Array.from(cats.values());
  }, [apps]);
}

export function useRecentApps(limit = 5) {
  const modules = useModuleStore((state) => state.modules);
  return useMemo(() => getRecentApps(limit), [modules, limit]);
}

export default useLauncherApps;
