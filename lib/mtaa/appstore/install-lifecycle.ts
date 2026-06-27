import { useAppStore } from '@/lib/stores/app-store';
import type { AppManifest } from '@/lib/appstore';

export function useInstallLifecycle() {
  const { installApp, uninstallApp, installedApps } = useAppStore();

  const isInstalled = (appId: string) => installedApps.includes(appId);

  const install = (manifest: AppManifest) => {
    installApp(manifest.id);
  };

  const uninstall = (manifest: AppManifest) => {
    uninstallApp(manifest.id);
  };

  const toggle = (manifest: AppManifest) => {
    if (isInstalled(manifest.id)) {
      uninstall(manifest);
    } else {
      install(manifest);
    }
  };

  return { install, uninstall, toggle, isInstalled };
}
