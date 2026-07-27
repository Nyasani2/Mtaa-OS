// lib/kernel/os-shell.ts
// OS Shell utilities — navigation guards, app lifecycle, shell state
// Imported by: app/(os)/health/index.tsx

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export interface ShellRoute {
  name: string;
  path: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresPin?: boolean;
}

export const OS_SHELL_ROUTES: ShellRoute[] = [
  { name: 'Home', path: '/(os)', icon: 'home', requiresAuth: true },
  { name: 'Wallet', path: '/(os)/wallet', icon: 'wallet', requiresAuth: true, requiresPin: true },
  { name: 'Health', path: '/(os)/health', icon: 'medical', requiresAuth: true },
  { name: 'Profile', path: '/(os)/profile', icon: 'person', requiresAuth: true },
  { name: 'Settings', path: '/(os)/settings', icon: 'settings', requiresAuth: true },
  { name: 'Streets', path: '/(os)/streets', icon: 'people', requiresAuth: true },
  { name: 'Phone', path: '/(os)/phone', icon: 'call', requiresAuth: true },
  { name: 'Messages', path: '/(os)/messages', icon: 'chatbubble', requiresAuth: true },
  { name: 'AppStore', path: '/(os)/appstore', icon: 'apps', requiresAuth: false },
];

/**
 * Navigate to an OS route with auth/pin guards
 */
export function useOSShell() {
  const router = useRouter();

  const navigate = useCallback((path: string) => {
    router.push(path as any);
  }, [router]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goHome = useCallback(() => {
    router.replace('/(os)' as any);
  }, [router]);

  return {
    navigate,
    goBack,
    goHome,
    routes: OS_SHELL_ROUTES,
  };
}

/**
 * Check if a route requires authentication
 */
export function routeRequiresAuth(path: string): boolean {
  const route = OS_SHELL_ROUTES.find((r) => path.startsWith(r.path));
  return route?.requiresAuth ?? false;
}

/**
 * Check if a route requires PIN verification
 */
export function routeRequiresPin(path: string): boolean {
  const route = OS_SHELL_ROUTES.find((r) => path.startsWith(r.path));
  return route?.requiresPin ?? false;
}

export default useOSShell;
