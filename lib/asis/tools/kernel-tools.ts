// @ts-nocheck
/**
 * ASIS Kernel Tools
 * Allows ASIS to interact with the MTAA OS App Registries and trigger navigation.
 */
import { OS_APP_REGISTRY, getAppRoute } from '@/lib/os/app-registry';
import { APP_REGISTRY, getAppById } from '@/lib/mtaa/appstore/registry';

export interface KernelToolResult {
  success: boolean;
  data?: any;
  error?: string;
  route?: string;
  action?: string;
}

export function launchApp(appId: string): KernelToolResult {
  let route = getAppRoute(appId);
  let appName = OS_APP_REGISTRY[appId]?.name;

  if (!route) {
    const appStoreApp = getAppById(appId);
    if (appStoreApp) {
      route = appStoreApp.route;
      appName = appStoreApp.name;
    }
  }

  if (route) {
    return { success: true, data: { appId, name: appName }, route };
  }

  const allApps = [...Object.values(OS_APP_REGISTRY), ...Object.values(APP_REGISTRY)];
  const found = allApps.find((a: any) => a.name.toLowerCase().includes(appId.toLowerCase()));
  if (found) {
    return { success: true, data: { appId: found.id, name: found.name }, route: found.route };
  }

  return { success: false, error: `App '${appId}' not found in MTAA OS registries.` };
}

export function listAvailableApps(): KernelToolResult {
  const osApps = Object.values(OS_APP_REGISTRY).map((a: any) => ({ id: a.id, name: a.name, category: a.category }));
  return { success: true, data: osApps };
}

export function getSystemStatus(): KernelToolResult {
  return {
    success: true,
    data: {
      os: 'MTAA OS v1.0.0',
      registriesLoaded: {
        osApps: Object.keys(OS_APP_REGISTRY).length,
        storeApps: Object.keys(APP_REGISTRY).length,
      },
      status: 'Operational',
    },
  };
}
