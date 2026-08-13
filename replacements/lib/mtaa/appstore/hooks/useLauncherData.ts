import { useMemo } from 'react';
import type { AppManifest, InstalledApp } from '@/types/module.types';

export function useLauncherData(installed: InstalledApp[]) {
  return useMemo(() => {
    const activeApps = installed.filter((i: any) => i.isActive).map((i: any) => i.manifest as AppManifest);
    return { activeApps, recentApps: activeApps.slice(0, 4) };
  }, [installed]);
}
