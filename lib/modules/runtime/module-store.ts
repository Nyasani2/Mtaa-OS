import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ModuleId,
  ModuleManifest,
  InstalledModule,
  ModuleRegistryState,
  ModuleLifecycle,
  InstallResult,
  LauncherApp,
} from "./module.types";

interface ModuleStoreActions {
  // Registry
  registerModule: (module: InstalledModule) => void;
  unregisterModule: (moduleId: ModuleId) => void;
  getModule: (moduleId: ModuleId) => InstalledModule | undefined;
  getAllModules: () => InstalledModule[];

  // Lifecycle
  setLifecycle: (moduleId: ModuleId, lifecycle: ModuleLifecycle) => void;
  installModule: (manifest: ModuleManifest, source?: InstalledModule["installSource"]) => InstallResult;
  uninstallModule: (moduleId: ModuleId) => InstallResult;
  enableModule: (moduleId: ModuleId) => void;
  disableModule: (moduleId: ModuleId) => void;
  suspendModule: (moduleId: ModuleId) => void;
  resumeModule: (moduleId: ModuleId) => void;

  // Launcher
  getLauncherApps: () => LauncherApp[];
  pinApp: (moduleId: ModuleId) => void;
  unpinApp: (moduleId: ModuleId) => void;

  // Permissions
  grantPermission: (moduleId: ModuleId, permission: string) => void;
  revokePermission: (moduleId: ModuleId, permission: string) => void;
  hasPermission: (moduleId: ModuleId, permission: string) => boolean;

  // Stats
  recordOpen: (moduleId: ModuleId) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const createInstalledModule = (
  manifest: ModuleManifest,
  source: InstalledModule["installSource"] = "appstore"
): InstalledModule => ({
  manifest,
  lifecycle: manifest.installable ? "installed" : "enabled",
  installedAt: Date.now(),
  updatedAt: Date.now(),
  installSource: source,
  openCount: 0,
});

export const useModuleStore = create<ModuleRegistryState & ModuleStoreActions>()(
  persist(
    (set, get) => ({
      modules: {},
      loading: false,
      error: null,

      registerModule: (module) =>
        set((state) => ({
          modules: { ...state.modules, [module.manifest.id]: module },
        })),

      unregisterModule: (moduleId) =>
        set((state) => {
          const next = { ...state.modules };
          delete next[moduleId];
          return { modules: next };
        }),

      getModule: (moduleId) => get().modules[moduleId],

      getAllModules: () => Object.values(get().modules),

      setLifecycle: (moduleId, lifecycle) =>
        set((state) => {
          const mod = state.modules[moduleId];
          if (!mod) return state;
          return {
            modules: {
              ...state.modules,
              [moduleId]: { ...mod, lifecycle, updatedAt: Date.now() },
            },
          };
        }),

      installModule: (manifest, source = "appstore") => {
        const existing = get().modules[manifest.id];
        if (existing && existing.lifecycle !== "uninstalled") {
          return { success: false, moduleId: manifest.id, error: "Already installed" };
        }
        const installed = createInstalledModule(manifest, source);
        set((state) => ({
          modules: { ...state.modules, [manifest.id]: installed },
        }));
        return { success: true, moduleId: manifest.id, manifest };
      },

      uninstallModule: (moduleId) => {
        const mod = get().modules[moduleId];
        if (!mod) {
          return { success: false, moduleId, error: "Module not found" };
        }
        if (mod.manifest.installable === false) {
          return { success: false, moduleId, error: "System module cannot be uninstalled" };
        }
        get().setLifecycle(moduleId, "uninstalled");
        setTimeout(() => get().unregisterModule(moduleId), 0);
        return { success: true, moduleId };
      },

      enableModule: (moduleId) => get().setLifecycle(moduleId, "enabled"),
      disableModule: (moduleId) => get().setLifecycle(moduleId, "disabled"),
      suspendModule: (moduleId) => get().setLifecycle(moduleId, "suspended"),
      resumeModule: (moduleId) => get().setLifecycle(moduleId, "enabled"),

      getLauncherApps: () => {
        return Object.values(get().modules)
          .filter((m) => {
            if (m.lifecycle !== "installed" && m.lifecycle !== "enabled") return false;
            if (m.manifest.visibility === "private") return false;
            if (m.manifest.enabled === false) return false;
            return true;
          })
          .map((m) => ({
            id: m.manifest.id,
            name: m.manifest.name,
            icon: m.manifest.icon,
            color: m.manifest.color,
            route: m.manifest.route,
            category: m.manifest.category,
            pinned: m.manifest.id === "settings" || m.manifest.id === "wallet",
          }));
      },

      pinApp: (moduleId) => {
        // Pinning is UI state, not stored in module lifecycle
        // Apps can be pinned in launcher independently
      },

      unpinApp: (moduleId) => {
        // Unpinning is UI state
      },

      grantPermission: (moduleId, permission) => {
        // Permission grants stored per-module in future extension
      },

      revokePermission: (moduleId, permission) => {
        // Permission revokes stored per-module in future extension
      },

      hasPermission: (moduleId, permission) => {
        const mod = get().modules[moduleId];
        if (!mod) return false;
        return mod.manifest.permissions.includes(permission);
      },

      recordOpen: (moduleId) =>
        set((state) => {
          const mod = state.modules[moduleId];
          if (!mod) return state;
          return {
            modules: {
              ...state.modules,
              [moduleId]: {
                ...mod,
                lastOpenedAt: Date.now(),
                openCount: (mod.openCount || 0) + 1,
              },
            },
          };
        }),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "mtaa-module-store",
      partialize: (state) => ({ modules: state.modules }),
    }
  )
);

export default useModuleStore;
