import { useState, useEffect, useCallback } from 'react';

export interface AppItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  screenshots: string[];
  rating: number;
  version: string;
  size: string;
  developer: string;
  installed: boolean;
}

export function useAppStore() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setApps([]);
    setIsLoading(false);
  }, []);

  const isInstalled = useCallback((appId: string) => {
    return apps.some(a => a.id === appId && a.installed);
  }, [apps]);

  const isInstalling = useCallback((appId: string) => {
    return installingId === appId;
  }, [installingId]);

  const installApp = useCallback(async (appId: string) => {
    setInstallingId(appId);
    await new Promise(r => setTimeout(r, 1000));
    setApps(prev => prev.map(a => a.id === appId ? { ...a, installed: true } : a));
    setInstallingId(null);
    return { success: true };
  }, []);

  const uninstallApp = useCallback(async (appId: string) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, installed: false } : a));
    return { success: true };
  }, []);

  const uninstall = uninstallApp;

  const getInstalledApps = useCallback(() => {
    return apps.filter(a => a.installed);
  }, [apps]);

  const searchApps = useCallback((query: string) => {
    return apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
  }, [apps]);

  const getTopCharts = useCallback(() => {
    return [...apps].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [apps]);

  return {
    apps,
    isLoading,
    isInstalled,
    isInstalling,
    installApp,
    uninstallApp,
    uninstall,
    getInstalledApps,
    searchApps,
    getTopCharts,
  };
}

export default useAppStore;
