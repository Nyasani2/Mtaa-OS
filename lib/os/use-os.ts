// lib/os/use-os.ts
import { useState, useEffect } from "react";

export interface InstalledAppV2 {
  id: string;
  name: string;
  version: string;
  icon?: string;
  category?: string;
  installedAt: string;
  enabled: boolean;
}

export function useOS() {
  const [installedApps, setInstalledApps] = useState<InstalledAppV2[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from storage or registry
    setInstalledApps([]);
    setLoading(false);
  }, []);

  const installApp = async (app: Omit<InstalledAppV2, "installedAt" | "enabled">) => {
    const newApp: InstalledAppV2 = { ...app, installedAt: new Date().toISOString(), enabled: true };
    setInstalledApps(prev => [...prev, newApp]);
    return newApp;
  };

  const uninstallApp = async (appId: string) => {
    setInstalledApps(prev => prev.filter(a => a.id !== appId));
  };

  const toggleApp = async (appId: string) => {
    setInstalledApps(prev => prev.map(a => a.id === appId ? { ...a, enabled: !a.enabled } : a));
  };

  return { installedApps, loading, installApp, uninstallApp, toggleApp };
}
