import { useMemo } from 'react';
import { useModuleStore } from "./module-store";
import type { InstalledModule, ModuleId, ModuleLifecycle } from "./module.types";

/**
 * Hook: useInstalledModules
 * Returns all installed modules with filtering and search.
 */

export interface UseInstalledModulesOptions {
  lifecycle?: ModuleLifecycle | ModuleLifecycle[];
  category?: string;
  search?: string;
  includeSystem?: boolean;
}

export function useInstalledModules(options: UseInstalledModulesOptions = {}) {
  const modules = useModuleStore((state) => state.modules);

  const filtered = useMemo(() => {
    let result = Object.values(modules);

    // Filter by lifecycle
    if (options.lifecycle) {
      const lifecycles = Array.isArray(options.lifecycle)
        ? options.lifecycle
        : [options.lifecycle];
      result = result.filter((m) => lifecycles.includes(m.lifecycle));
    }

    // Filter by category
    if (options.category) {
      result = result.filter((m) => m.manifest.category === options.category);
    }

    // Exclude system modules unless requested
    if (options.includeSystem !== true) {
      result = result.filter((m) => m.manifest.installable !== false);
    }

    // Search filter
    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.manifest.name.toLowerCase().includes(q) ||
          m.manifest.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [modules, options.lifecycle, options.category, options.search, options.includeSystem]);

  const stats = useMemo(() => {
    const all = Object.values(modules);
    return {
      total: all.length,
      installed: all.filter((m) => m.lifecycle === "installed").length,
      enabled: all.filter((m) => m.lifecycle === "enabled").length,
      disabled: all.filter((m) => m.lifecycle === "disabled").length,
      suspended: all.filter((m) => m.lifecycle === "suspended").length,
      updating: all.filter((m) => m.lifecycle === "updating").length,
      system: all.filter((m) => m.manifest.installable === false).length,
    };
  }, [modules]);

  return {
    modules: filtered,
    stats,
    isLoading: useModuleStore((state) => state.loading),
    error: useModuleStore((state) => state.error),
  };
}

export function useModule(moduleId: ModuleId) {
  return useModuleStore((state) => state.modules[moduleId]);
}

export function useModuleLifecycle(moduleId: ModuleId): ModuleLifecycle | null {
  return useModuleStore((state) => state.modules[moduleId]?.lifecycle || null);
}

export function useIsModuleInstalled(moduleId: ModuleId): boolean {
  return useModuleStore((state) => {
    const mod = state.modules[moduleId];
    return !!mod && mod.lifecycle !== "uninstalled";
  });
}

export function useIsModuleEnabled(moduleId: ModuleId): boolean {
  return useModuleStore((state) => {
    const mod = state.modules[moduleId];
    return !!mod && (mod.lifecycle === "enabled" || mod.lifecycle === "installed");
  });
}

export default useInstalledModules;
