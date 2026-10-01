import { osEvents } from "./os-events";
import { Platform } from 'react-native';

export type AppState = "inactive" | "active" | "background";

export type RunningApp = {
  id: string;
  state: AppState;
  openedAt: number;
};

const memory: Record<string, RunningApp> = {};
const STORAGE_KEY = "mtaa_running_apps";

const getStore = (): Record<string, RunningApp> => {
  if (typeof window === "undefined") return memory;

  const storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  const raw = storage?.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveStore = (data: Record<string, RunningApp>) => {
  if (typeof window === "undefined") {
    Object.assign(memory, data);
    return;
  }

  const storageSet = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  storageSet?.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const AppLifecycle = {
  open(appId: string) {
    const store = getStore();

    store[appId] = {
      id: appId,
      state: "active",
      openedAt: Date.now(),
    };

    saveStore(store);
    osEvents.emit("apps_changed");
  },

  background(appId: string) {
    const store = getStore();
    if (!store[appId]) return;

    store[appId].state = "background";
    saveStore(store);
    osEvents.emit("apps_changed");
  },

  close(appId: string) {
    const store = getStore();
    delete store[appId];

    saveStore(store);
    osEvents.emit("apps_changed");
  },

  getRunning(): RunningApp[] {
    const store = getStore();
    return Object.values(store);
  },
};
