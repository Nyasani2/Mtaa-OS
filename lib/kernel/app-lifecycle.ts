import { Platform } from 'react-native';
// lib/os/app-lifecycle.ts
const STORAGE_KEY = 'mtaa_app_lifecycle';

export interface AppLifecycleState {
  lastActiveAt: string;
  sessionDuration: number;
  appVersion: string;
}

export function getLifecycleState(): AppLifecycleState | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  const raw = storage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLifecycleState(data: AppLifecycleState): void {
  if (typeof window === 'undefined') return;
  try {
    const storageSet = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  storageSet?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silent fail
  }
}

export function recordAppLaunch(): void {
  if (typeof window === 'undefined') return;
  const now = new Date().toISOString();
  const existing = getLifecycleState();
  setLifecycleState({
    lastActiveAt: now,
    sessionDuration: existing?.sessionDuration || 0,
    appVersion: existing?.appVersion || '1.0.0',
  });
}
