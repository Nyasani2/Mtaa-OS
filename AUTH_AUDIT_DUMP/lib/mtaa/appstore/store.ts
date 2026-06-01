"use client";

import { create } from "zustand";
import type { AppManifest, InstalledApp } from "./apps/types";

interface AppStoreState {
  apps: AppManifest[];
  installed: InstalledApp[];
  isLoading: boolean;
  error: string | null;
  installApp: (manifest: AppManifest) => Promise<boolean>;
  uninstallApp: (appId: string) => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  apps: [],
  installed: [],
  isLoading: false,
  error: null,
  installApp: async (manifest) => {
    set((state) => ({
      installed: [...state.installed, { manifest, installDate: new Date().toISOString(), isActive: true }],
    }));
    return true;
  },
  uninstallApp: async (appId) => {
    set((state) => ({
      installed: state.installed.filter((i) => i.manifest.id !== appId),
    }));
  },
}));
