import type { ModuleId, ModuleLifecycle } from "./module.types";
import { useModuleStore } from "./module-store";

/**
 * Lifecycle authority — manages module state transitions.
 * States: installed → enabled → disabled → suspended → updating → uninstalled
 */

export const VALID_TRANSITIONS: Record<ModuleLifecycle, ModuleLifecycle[]> = {
  installed: ["enabled", "disabled", "uninstalled"],
  enabled: ["disabled", "suspended", "updating", "uninstalled"],
  disabled: ["enabled", "uninstalled"],
  suspended: ["enabled", "disabled", "uninstalled"],
  updating: ["enabled", "disabled", "suspended"],
  uninstalled: ["installed"],
};

export function canTransition(from: ModuleLifecycle, to: ModuleLifecycle): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

export function getLifecycle(moduleId: ModuleId): ModuleLifecycle | null {
  return useModuleStore.getState().modules[moduleId]?.lifecycle || null;
}

export function setLifecycle(moduleId: ModuleId, lifecycle: ModuleLifecycle): boolean {
  const store = useModuleStore.getState();
  const mod = store.modules[moduleId];
  if (!mod) return false;

  if (!canTransition(mod.lifecycle, lifecycle)) {
    console.warn(`Invalid lifecycle transition: ${mod.lifecycle} → ${lifecycle} for ${moduleId}`);
    return false;
  }

  store.setLifecycle(moduleId, lifecycle);
  return true;
}

export function isActive(moduleId: ModuleId): boolean {
  const lifecycle = getLifecycle(moduleId);
  return lifecycle === "installed" || lifecycle === "enabled" || lifecycle === "updating";
}

export function isLaunchable(moduleId: ModuleId): boolean {
  const lifecycle = getLifecycle(moduleId);
  return lifecycle === "installed" || lifecycle === "enabled";
}

export function lifecycleToString(lifecycle: ModuleLifecycle): string {
  const labels: Record<ModuleLifecycle, string> = {
    installed: "Installed",
    enabled: "Active",
    disabled: "Disabled",
    suspended: "Suspended",
    updating: "Updating",
    uninstalled: "Not Installed",
  };
  return labels[lifecycle] || lifecycle;
}

export function getLifecycleIcon(lifecycle: ModuleLifecycle): string {
  const icons: Record<ModuleLifecycle, string> = {
    installed: "Download",
    enabled: "CheckCircle",
    disabled: "XCircle",
    suspended: "PauseCircle",
    updating: "RefreshCw",
    uninstalled: "Trash2",
  };
  return icons[lifecycle] || "HelpCircle";
}

export function getLifecycleColor(lifecycle: ModuleLifecycle): string {
  const colors: Record<ModuleLifecycle, string> = {
    installed: "#F59E0B",
    enabled: "#10B981",
    disabled: "#6B7280",
    suspended: "#EF4444",
    updating: "#3B82F6",
    uninstalled: "#374151",
  };
  return colors[lifecycle] || "#9CA3AF";
}

export default {
  VALID_TRANSITIONS,
  canTransition,
  getLifecycle,
  setLifecycle,
  isActive,
  isLaunchable,
  lifecycleToString,
  getLifecycleIcon,
  getLifecycleColor,
};
