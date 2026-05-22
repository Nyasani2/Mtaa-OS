"use client";

import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { getAppById, isSystemApp, isLocalApp } from "./registry";
import type { AppManifest } from "./apps/types";

export function useLauncher() {
  const router = useRouter();
  const [recentApps, setRecentApps] = useState<string[]>([]);

  const launchApp = useCallback((app: AppManifest) => {
    setRecentApps((prev) => {
      const filtered = prev.filter((id) => id !== app.id);
      return [app.id, ...filtered].slice(0, 10);
    });

    // Navigate to app entry point
    const entry = (app as any).entryPoints?.[0] || app.entry;
    router.push(entry as any);
  }, [router]);

  const getAppEntry = useCallback((appId: string) => {
    const app = getAppById(appId);
    return app?.entry || "/";
  }, []);

  const isAppInstalled = useCallback((appId: string) => {
    return !!getAppById(appId);
  }, []);

  return {
    launchApp,
    getAppEntry,
    isAppInstalled,
    recentApps,
  };
}
