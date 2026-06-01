"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/mtaa/appstore/store";
import type { AppManifest } from "@/lib/mtaa/appstore/apps/types";

interface LauncherSection {
  id: string;
  title: string;
  apps: AppManifest[];
}

export function useLauncherData() {
  const { apps, installed } = useAppStore();
  const [sections, setSections] = useState<LauncherSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activeApps = installed.filter((i: { isActive: boolean }) => i.isActive).map((i: { manifest: AppManifest }) => i.manifest);
    const osApps = apps.filter((a: AppManifest) => a.isOSApp);
    const userApps = activeApps.filter((a: AppManifest) => !a.isOSApp);
    setSections([
      { id: "os", title: "System Apps", apps: osApps },
      { id: "installed", title: "Installed", apps: userApps },
    ]);
    setIsLoading(false);
  }, [apps, installed]);

  const allApps = sections.flatMap((s) => s.apps);
  const handleLaunch = (app: AppManifest) => { console.log("Launching", app.id); };

  return { sections, allApps, handleLaunch, isLoading };
}
