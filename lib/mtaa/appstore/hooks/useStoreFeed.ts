// @ts-nocheck
"use client";

import { useState, useCallback } from 'react';
import { useAppStore } from "@/lib/mtaa/appstore/store";
import type { AppManifest, ModuleManifest, InstalledApp } from "@/lib/mtaa/appstore/apps/types";

export function useStoreFeed() {
  const { apps, installed, isLoading, error } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useCallback(() => {
    const cats = new Map<string, ModuleManifest[]>();
    apps.forEach((app: AppManifest) => {
      const list = cats.get(app.category) || [];
      list.push(app as unknown as ModuleManifest);
      cats.set(app.category, list);
    });
    return Array.from(cats.entries()).map(([id, apps]) => ({ id, name: id, apps }));
  }, [apps]);

  const featured = useCallback(() => apps.slice(0, 5) as unknown as ModuleManifest[], [apps]);
  const trending = useCallback(() => apps.slice(0, 10) as unknown as ModuleManifest[], [apps]);
  const newReleases = useCallback(() => apps.slice(0, 8) as unknown as ModuleManifest[], [apps]);
  const topRated = useCallback(() => apps.slice(0, 6) as unknown as ModuleManifest[], [apps]);

  const searchApps = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) return apps as unknown as ModuleManifest[];
    return apps.filter((a: AppManifest) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
    ) as unknown as ModuleManifest[];
  }, [apps]);

  const getInstallState = useCallback((appId: string) => {
    return installed.find((i: InstalledApp) => i.manifest.id === appId)?.isActive || false;
  }, [installed]);

  const stats = useCallback(() => ({ total: apps.length, installed: installed.length }), [apps, installed]);

  return {
    categories: categories(),
    featured: featured(),
    trending: trending(),
    newReleases: newReleases(),
    topRated: topRated(),
    searchApps,
    getInstallState,
    stats: stats(),
    isLoading,
    error,
  };
}
