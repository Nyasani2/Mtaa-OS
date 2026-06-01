"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/mtaa/appstore/store";
import type { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export function useAppStoreInstaller() {
  const { installApp, uninstallApp, installed } = useAppStore();
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);

  const install = useCallback(async (manifest: AppManifest) => {
    setIsInstalling(true); setProgress(0);
    try {
      const result = await installApp(manifest);
      setProgress(100);
      return { success: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Install failed" };
    } finally { setIsInstalling(false); }
  }, [installApp]);

  const uninstall = useCallback(async (appId: string) => {
    try { await uninstallApp(appId); return { success: true }; }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : "Uninstall failed" }; }
  }, [uninstallApp]);

  const enable = useCallback(async (appId: string) => ({ success: true }), []);
  const disable = useCallback(async (appId: string) => ({ success: true }), []);

  const getInstallState = useCallback((appId: string) => {
    const app = installed.find((i: { manifest: AppManifest }) => i.manifest.id === appId);
    return { installed: !!app, active: app?.isActive || false, progress: app ? 100 : 0 };
  }, [installed]);

  return { install, uninstall, enable, disable, getInstallState, isInstalling, progress };
}
