import type { ModuleId, ModuleManifest, InstalledModule } from "./module.types";
import { useModuleStore } from "./module-store";

/**
 * Central registry authority for all installed modules.
 * Reads canonical manifests from lib/modules/* at runtime.
 * No hardcoded apps. No static imports. Registry-driven only.
 */

export class ModuleRegistry {
  private static instance: ModuleRegistry;

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  getStore() {
    return useModuleStore.getState();
  }

  getModule(moduleId: ModuleId): InstalledModule | undefined {
    return this.getStore().getModule(moduleId);
  }

  getAllModules(): InstalledModule[] {
    return this.getStore().getAllModules();
  }

  getModuleManifest(moduleId: ModuleId): ModuleManifest | undefined {
    return this.getStore().getModule(moduleId)?.manifest;
  }

  isInstalled(moduleId: ModuleId): boolean {
    const mod = this.getModule(moduleId);
    return !!mod && mod.lifecycle !== "uninstalled";
  }

  isEnabled(moduleId: ModuleId): boolean {
    const mod = this.getModule(moduleId);
    return !!mod && (mod.lifecycle === "enabled" || mod.lifecycle === "installed");
  }

  isVisible(moduleId: ModuleId): boolean {
    const mod = this.getModule(moduleId);
    if (!mod) return false;
    if (mod.manifest.visibility === "private") return false;
    if (mod.manifest.enabled === false) return false;
    return true;
  }

  getModulesByCategory(category: string): InstalledModule[] {
    return this.getAllModules().filter((m) => m.manifest.category === category);
  }

  getModulesByLifecycle(lifecycle: string): InstalledModule[] {
    return this.getAllModules().filter((m) => m.lifecycle === lifecycle);
  }

  getSystemModules(): InstalledModule[] {
    return this.getAllModules().filter((m) => m.manifest.installable === false);
  }

  getInstallableModules(): InstalledModule[] {
    return this.getAllModules().filter((m) => m.manifest.installable === true);
  }

  searchModules(query: string): InstalledModule[] {
    const q = query.toLowerCase();
    return this.getAllModules().filter(
      (m) =>
        m.manifest.name.toLowerCase().includes(q) ||
        m.manifest.description.toLowerCase().includes(q) ||
        m.manifest.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  getDependencyTree(moduleId: ModuleId): ModuleId[] {
    const mod = this.getModuleManifest(moduleId);
    if (!mod) return [];
    const deps = new Set<ModuleId>();
    const traverse = (id: ModuleId) => {
      const m = this.getModuleManifest(id);
      if (!m) return;
      m.dependencies.forEach((dep) => {
        if (!deps.has(dep)) {
          deps.add(dep);
          traverse(dep);
        }
      });
    };
    traverse(moduleId);
    return Array.from(deps);
  }

  checkDependencies(moduleId: ModuleId): { satisfied: boolean; missing: ModuleId[] } {
    const mod = this.getModuleManifest(moduleId);
    if (!mod) return { satisfied: false, missing: [] };
    const missing = mod.dependencies.filter((dep) => !this.isInstalled(dep));
    return { satisfied: missing.length === 0, missing };
  }
}

export const registry = ModuleRegistry.getInstance();
export default registry;
