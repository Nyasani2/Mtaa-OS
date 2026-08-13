import { create } from 'zustand';
import type { AppManifest, InstalledApp } from '@/types/module.types';

interface AppStoreState {
  installed: InstalledApp[];
  installApp: (manifest: AppManifest) => void;
  uninstallApp: (appId: string) => void;
  setAppActive: (appId: string, active: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  installed: [],
  installApp: (manifest) =>
    set((state) => ({
      installed: [
        ...state.installed,
        { id: manifest.id, version: manifest.version, manifest, installedAt: new Date().toISOString(), isActive: true } as InstalledApp,
      ],
    })),
  uninstallApp: (appId) =>
    set((state) => ({
      installed: state.installed.filter((i) => i.id !== appId),
    })),
  setAppActive: (appId, active) =>
    set((state) => ({
      installed: state.installed.map((i) =>
        i.id === appId ? { ...i, isActive: active } : i
      ),
    })),
}));
