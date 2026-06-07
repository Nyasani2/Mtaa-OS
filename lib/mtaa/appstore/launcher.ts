// lib/mtaa/appstore/launcher.ts — App Launcher Hook
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getAppById } from './unified-registry';

export function useLauncher() {
  const router = useRouter();

  const launchApp = useCallback((appId: string) => {
    const app = getAppById(appId);
    if (!app) {
      console.warn(`[Launcher] App not found: ${appId}`);
      return;
    }

    // System apps launch directly
    if (app.is_system_app) {
      router.push(app.entry_route as any);
      return;
    }

    // Non-system apps check if installed
    if (!app.is_installed) {
      // Redirect to app store detail page
      router.push(`/appstore/${appId}` as any);
      return;
    }

    router.push(app.entry_route as any);
  }, [router]);

  return { launchApp };
}

export default useLauncher;
