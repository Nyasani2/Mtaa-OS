import { useAppStore } from '@/lib/appstore';
import { getAppById, getAllApps } from './unified-registry';

export function useInstallLifecycle() {
  const { installApp, uninstallApp, installedApps } = useAppStore();

  const install = (appId: string) => {
    const app = getAppById(appId);
    if (!app) return false;
    installApp(appId);
    return true;
  };

  const uninstall = (appId: string) => {
    if (!installedApps.includes(appId)) return false;
    uninstallApp(appId);
    return true;
  };

  const isInstalled = (appId: string) => installedApps.includes(appId);

  const getInstalledApps = () => {
    return getAllApps().filter((app) => installedApps.includes(app.id));
  };

  return { install, uninstall, isInstalled, getInstalledApps };
}

export default useInstallLifecycle;

