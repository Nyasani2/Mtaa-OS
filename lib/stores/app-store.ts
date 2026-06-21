import { create } from 'zustand';

interface AppStoreState {
  installedApps: string[];
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
  isInstalled: (appId: string) => boolean;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  installedApps: [],
  installApp: (appId) => set((state) => ({
    installedApps: state.installedApps.includes(appId)
      ? state.installedApps
      : [...state.installedApps, appId]
  })),
  uninstallApp: (appId) => set((state) => ({
    installedApps: state.installedApps.filter((id) => id !== appId)
  })),
  isInstalled: (appId) => get().installedApps.includes(appId),
}));
