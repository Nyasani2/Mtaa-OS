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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLifecycleState(data: AppLifecycleState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
