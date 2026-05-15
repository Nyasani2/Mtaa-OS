/**
 * MTAA OS — App Manifest System
 * Every app exposes: manifest.ts, entry.ts, permissions.ts, routes.ts
 * Installed ONLY through registry lifecycle.
 */

import { AppManifest, AppPermission, AppRoute } from '../registry/kernel-registry';

export interface AppEntry {
  init: (config: Record<string, unknown>) => Promise<void> | void;
  destroy?: () => Promise<void> | void;
  getExports?: () => Record<string, unknown>;
}

export interface AppPackage {
  manifest: AppManifest;
  entry: AppEntry;
  permissions: AppPermission[];
  routes: AppRoute[];
}

/**
 * Base class for all MTAA apps.
 * Extend this to create a valid app package.
 */
export abstract class BaseApp implements AppPackage {
  abstract manifest: AppManifest;
  abstract entry: AppEntry;
  abstract permissions: AppPermission[];
  abstract routes: AppRoute[];

  validate(): string[] {
    const errors: string[] = [];

    if (!this.manifest.id) errors.push('manifest.id is required');
    if (!this.manifest.name) errors.push('manifest.name is required');
    if (!this.manifest.version) errors.push('manifest.version is required');
    if (!this.manifest.domain) errors.push('manifest.domain is required');
    if (!this.manifest.entryPoint) errors.push('manifest.entryPoint is required');
    if (!this.routes.length) errors.push('At least one route is required');
    if (!this.permissions.length) errors.push('At least one permission is required');

    // Validate route paths
    for (const route of this.routes) {
      if (!route.path.startsWith('/')) errors.push(`Route path must start with /: ${route.path}`);
      if (!route.component) errors.push(`Route component is required for ${route.path}`);
    }

    // Validate permission resources
    for (const perm of this.permissions) {
      if (!perm.resource) errors.push('Permission resource is required');
      if (!perm.actions.length) errors.push(`Permission ${perm.resource} has no actions`);
    }

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }
}

/**
 * Helper to create a standard app manifest.
 */
export function createManifest(
  id: string,
  name: string,
  version: string,
  domain: string,
  entryPoint: string,
  options: Partial<Omit<AppManifest, 'id' | 'name' | 'version' | 'domain' | 'entryPoint'>> = {}
): AppManifest {
  return {
    id,
    name,
    version,
    domain,
    entryPoint,
    description: options.description || '',
    icon: options.icon,
    color: options.color,
    permissions: options.permissions || [],
    routes: options.routes || [],
    dependencies: options.dependencies || [],
    enabled: options.enabled ?? true,
    installable: options.installable ?? true,
    systemApp: options.systemApp ?? false,
    minKernelVersion: options.minKernelVersion,
    configSchema: options.configSchema,
  };
}

/**
 * Helper to create standard app permissions.
 */
export function createPermissions(
  resource: string,
  actions: AppPermission['actions'],
  description: string
): AppPermission {
  return { resource, actions, description };
}

/**
 * Helper to create standard app routes.
 */
export function createRoute(
  path: string,
  component: string,
  title: string,
  options: Partial<Omit<AppRoute, 'path' | 'component' | 'title'>> = {}
): AppRoute {
  return {
    path,
    component,
    title,
    requiresAuth: options.requiresAuth ?? true,
    requiredPermissions: options.requiredPermissions,
  };
}

export default BaseApp;
