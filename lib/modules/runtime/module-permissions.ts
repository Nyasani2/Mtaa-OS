import type { AppPermission, ModuleId } from "./module.types";
import { useModuleStore } from "./module-store";

/**
 * Permission authority — manages app-level permissions.
 * Supports: camera, microphone, contacts, storage, location,
 * notifications, wallet, biometric.
 */

export const CORE_PERMISSIONS: AppPermission[] = [
  "camera",
  "microphone",
  "contacts",
  "storage",
  "location",
  "notifications",
  "wallet",
  "biometric",
];

export interface PermissionRequest {
  moduleId: ModuleId;
  permission: AppPermission;
  rationale?: string;
}

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  requested: boolean;
  rationale?: string;
}

// In-memory permission state (persisted per-device in production)
const permissionState: Record<ModuleId, Record<AppPermission, PermissionStatus>> = {};

export function requestPermission(req: PermissionRequest): PermissionStatus {
  const store = useModuleStore.getState();
  const mod = store.modules[req.moduleId];

  if (!mod) {
    return { granted: false, denied: true, requested: false };
  }

  if (!mod.manifest.permissions.includes(req.permission)) {
    return { granted: false, denied: true, requested: false };
  }

  if (!permissionState[req.moduleId]) {
    permissionState[req.moduleId] = {} as Record<AppPermission, PermissionStatus>;
  }

  // Auto-grant system modules
  if (mod.manifest.installable === false) {
    permissionState[req.moduleId][req.permission] = {
      granted: true,
      denied: false,
      requested: true,
      rationale: req.rationale,
    };
    return permissionState[req.moduleId][req.permission];
  }

  // For installable modules, simulate user approval
  const status: PermissionStatus = {
    granted: true,
    denied: false,
    requested: true,
    rationale: req.rationale,
  };

  permissionState[req.moduleId][req.permission] = status;
  return status;
}

export function revokePermission(moduleId: ModuleId, permission: AppPermission): void {
  if (permissionState[moduleId]?.[permission]) {
    permissionState[moduleId][permission] = {
      granted: false,
      denied: true,
      requested: true,
    };
  }
}

export function checkPermission(moduleId: ModuleId, permission: AppPermission): PermissionStatus {
  return (
    permissionState[moduleId]?.[permission] || {
      granted: false,
      denied: false,
      requested: false,
    }
  );
}

export function hasPermission(moduleId: ModuleId, permission: AppPermission): boolean {
  return checkPermission(moduleId, permission).granted;
}

export function getModulePermissions(moduleId: ModuleId): AppPermission[] {
  const store = useModuleStore.getState();
  return store.modules[moduleId]?.manifest.permissions || [];
}

export function getGrantedPermissions(moduleId: ModuleId): AppPermission[] {
  const perms = permissionState[moduleId];
  if (!perms) return [];
  return Object.entries(perms)
    .filter(([, status]) => status.granted)
    .map(([perm]) => perm as AppPermission);
}

export function requirePermission(moduleId: ModuleId, permission: AppPermission): boolean {
  const status = checkPermission(moduleId, permission);
  if (!status.granted) {
    const newStatus = requestPermission({ moduleId, permission });
    return newStatus.granted;
  }
  return true;
}

export default {
  CORE_PERMISSIONS,
  requestPermission,
  revokePermission,
  checkPermission,
  hasPermission,
  getModulePermissions,
  getGrantedPermissions,
  requirePermission,
};
