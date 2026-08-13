import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppManifest, InstallStatus } from './types';
import { ALL_APPS } from './data';

const INSTALLED_APPS_KEY = 'mtaa_installed_apps';
const APP_VERSIONS_KEY = 'mtaa_app_versions';

export function useAppStore() {
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [installingApps, setInstallingApps] = useState<Set<string>>(new Set());
  const [appVersions, setAppVersions] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);

  // Load installed apps from storage on mount
  useEffect(() => {
    loadInstalledApps();
  }, []);

  const loadInstalledApps = async () => {
    try {
      const [installedRaw, versionsRaw] = await Promise.all([
        AsyncStorage.getItem(INSTALLED_APPS_KEY),
        AsyncStorage.getItem(APP_VERSIONS_KEY),
      ]);
      if (installedRaw) {
        const ids = JSON.parse(installedRaw);
        setInstalledApps(new Set(ids));
      }
      if (versionsRaw) {
        setAppVersions(JSON.parse(versionsRaw));
      }
    } catch (e) {
      console.error('[AppStore] Failed to load installed apps:', e);
    } finally {
      setIsReady(true);
    }
  };

  const saveInstalledApps = async (apps: Set<string>, versions: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify([...apps]));
      await AsyncStorage.setItem(APP_VERSIONS_KEY, JSON.stringify(versions));
    } catch (e) {
      console.error('[AppStore] Failed to save installed apps:', e);
    }
  };

  const isInstalled = useCallback((appId: string): boolean => {
    return installedApps.has(appId);
  }, [installedApps]);

  const isInstallingApp = useCallback((appId: string): boolean => {
    return installingApps.has(appId);
  }, [installingApps]);

  const getInstallStatus = useCallback((appId: string): InstallStatus => {
    if (installingApps.has(appId)) return 'installing';
    if (installedApps.has(appId)) return 'installed';
    return 'not_installed';
  }, [installedApps, installingApps]);

  const installApp = useCallback(async (appId: string): Promise<void> => {
    const app = ALL_APPS.find((a: any) => a.id === appId);
    if (!app) return;

    setInstallingApps(prev => new Set(prev).add(appId));

    // Simulate install delay (in real app, this would download and extract)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setInstallingApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });

    setInstalledApps(prev => {
      const next = new Set(prev);
      next.add(appId);
      return next;
    });

    setAppVersions(prev => {
      const next = { ...prev, [appId]: app.version };
      saveInstalledApps(new Set([...installedApps, appId]), next);
      return next;
    });
  }, [installedApps]);

  const uninstallApp = useCallback(async (appId: string): Promise<void> => {
    setInstalledApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      const newVersions = { ...appVersions };
      delete newVersions[appId];
      saveInstalledApps(next, newVersions);
      return next;
    });
  }, [appVersions]);

  const getInstalledApps = useCallback((): AppManifest[] => {
    return ALL_APPS.filter((a: any) => installedApps.has(a.id));
  }, [installedApps]);

  const getUpdateAvailable = useCallback((appId: string): boolean => {
    const app = ALL_APPS.find((a: any) => a.id === appId);
    if (!app || !installedApps.has(appId)) return false;
    const installedVersion = appVersions[appId];
    return installedVersion !== app.version;
  }, [installedApps, appVersions]);

  const getAppsWithUpdates = useCallback((): AppManifest[] => {
    return ALL_APPS.filter((a: any) => {
      if (!installedApps.has(a.id)) return false;
      return appVersions[a.id] !== a.version;
    });
  }, [installedApps, appVersions]);

  return {
    isReady,
    isInstalled,
    isInstallingApp,
    getInstallStatus,
    installApp,
    uninstallApp,
    getInstalledApps,
    getUpdateAvailable,
    getAppsWithUpdates,
    installedCount: installedApps.size,
  };
}
