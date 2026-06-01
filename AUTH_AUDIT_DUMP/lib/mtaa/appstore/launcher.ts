// lib/mtaa/appstore/launcher.ts
import { useRouter } from "expo-router";
import { APP_REGISTRY, getAppById } from "./unified-registry";

export interface LauncherContextValue {
  apps: typeof APP_REGISTRY;
  launchApp: (appId: string) => void;
  listApps: () => typeof APP_REGISTRY;
  isInstalled: (appId: string) => boolean;
}

export function useLauncher(): LauncherContextValue {
  const router = useRouter();

  const launchApp = (appId: string) => {
    const app = getAppById(appId);
    if (!app) {
      console.warn(`App ${appId} not found in registry`);
      return;
    }
    if (!app.isInstalled && !app.isOSApp) {
      console.warn(`App ${appId} is not installed`);
      return;
    }
    router.push(app.route as any);
  };

  const listApps = () => APP_REGISTRY;

  const isInstalled = (appId: string) => {
    const app = getAppById(appId);
    return app ? app.isInstalled || app.isOSApp : false;
  };

  return { apps: APP_REGISTRY, launchApp, listApps, isInstalled };
}
