export interface AppRegistryEntry {
  id: string;
  name: string;
  route: string;
  icon: string;
  category: string;
  enabled: boolean;
  requiresAuth: boolean;
}

export const appRegistry: AppRegistryEntry[] = [
  // OS Core
  { id: 'wallet', name: 'Wallet', route: '/(os)/wallet', icon: 'wallet', category: 'Finance', enabled: true, requiresAuth: true },
  { id: 'profile', name: 'Profile', route: '/(os)/profile', icon: 'user', category: 'Social', enabled: true, requiresAuth: true },
  { id: 'messages', name: 'Messages', route: '/(os)/messages', icon: 'message-circle', category: 'Social', enabled: true, requiresAuth: true },
  { id: 'settings', name: 'Settings', route: '/(os)/settings', icon: 'settings', category: 'System', enabled: true, requiresAuth: false },
  { id: 'health', name: 'Health', route: '/(os)/health', icon: 'heart', category: 'Health', enabled: true, requiresAuth: true },
  { id: 'education', name: 'Education', route: '/(education)/courses', icon: 'book-open', category: 'Education', enabled: true, requiresAuth: true },
  { id: 'marketplace', name: 'Marketplace', route: '/(commerce)/marketplace', icon: 'shopping-bag', category: 'Commerce', enabled: true, requiresAuth: true },
  { id: 'jobs', name: 'Jobs', route: '/(work)/jobs', icon: 'briefcase', category: 'Work', enabled: true, requiresAuth: true },
  { id: 'streets', name: 'Streets', route: '/(os)/streets', icon: 'globe', category: 'Social', enabled: true, requiresAuth: true },
  { id: 'mtruck', name: 'MTruck', route: '/(transport)/mtruck', icon: 'truck', category: 'Transport', enabled: true, requiresAuth: true },
  { id: 'mtaxi', name: 'MTaxi', route: '/(transport)/mtaxi', icon: 'car', category: 'Transport', enabled: true, requiresAuth: true },
  // Civic apps — HIDDEN from registry (not launchable)
];

export function getEnabledApps(): AppRegistryEntry[] {
  return appRegistry.filter((app: any) => app.enabled);
}

export function getAppById(id: string): AppRegistryEntry | undefined {
  return appRegistry.find((app: any) => app.id === id);
}
