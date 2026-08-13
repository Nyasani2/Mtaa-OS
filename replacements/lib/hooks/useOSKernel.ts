import type { AppItem } from '@/lib/mtaa/appstore/apps/types';

export function useOSKernel() {
  return {
    apps: [] as AppItem[],
    launchApp: (appId: string) => {},
    isAppRunning: (appId: string) => false,
  };
}
