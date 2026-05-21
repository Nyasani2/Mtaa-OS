import type {
  AppManifest,
  AppPermission,
  AppRoute,
} from '../registry/kernel-registry';

export function createManifest(
  manifest: AppManifest
): AppManifest {
  return manifest;
}

export function createPermission(
  resource: string,
  actions: string[],
  description?: string
): AppPermission {
  return {
    resource,
    actions,
    description,
  };
}

export function createRoute(
  title: string,
  path: string,
  component: any,
  options: Partial<AppRoute> = {}
): AppRoute {
  return {
    title,
    path,
    component,
    requiresAuth: options.requiresAuth ?? true,
    requiredPermissions: options.requiredPermissions ?? [],
  };
}
