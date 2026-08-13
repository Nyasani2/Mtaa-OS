export interface OSAppEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  route: string;
  category: string;
  requiresAuth: boolean;
  isSystemApp: boolean;
  permissions: string[];
}

export const OS_APP_REGISTRY: Record<string, OSAppEntry> = {
  wallet: {
    id: 'wallet', name: 'Wallet', icon: 'cash-outline', color: '#10B981',
    route: '/(os)/wallet', category: 'finance', requiresAuth: true,
    isSystemApp: true, permissions: ['wallet_read', 'wallet_write'],
  },
  health: {
    id: 'health', name: 'Health', icon: 'medical-outline', color: '#EF4444',
    route: '/(os)/health', category: 'health', requiresAuth: true,
    isSystemApp: true, permissions: ['health_read', 'health_write', 'location'],
  },
  education: {
    id: 'education', name: 'Education', icon: 'school-outline', color: '#8B5CF6',
    route: '/(education)', category: 'education', requiresAuth: true,
    isSystemApp: true, permissions: ['education_read', 'education_write'],
  },
  streets: {
    id: 'streets', name: 'Streets', icon: 'newspaper-outline', color: '#3B82F6',
    route: '/(os)/streets', category: 'social', requiresAuth: true,
    isSystemApp: true, permissions: ['camera', 'photos', 'location', 'microphone'],
  },
  tribes: {
    id: 'tribes', name: 'Tribes', icon: 'people-outline', color: '#14B8A6',
    route: '/(os)/tribes', category: 'social', requiresAuth: true,
    isSystemApp: true, permissions: ['contacts', 'notifications'],
  },
  messages: {
    id: 'messages', name: 'Messages', icon: 'chatbubble-outline', color: '#06B6D4',
    route: '/(communication)/messages', category: 'social', requiresAuth: true,
    isSystemApp: true, permissions: ['contacts', 'camera', 'microphone', 'photos'],
  },
  gallery: {
    id: 'gallery', name: 'Gallery', icon: 'images-outline', color: '#EC4899',
    route: '/(media)/gallery', category: 'media', requiresAuth: true,
    isSystemApp: true, permissions: ['photos', 'camera'],
  },
  camera: {
    id: 'camera', name: 'Camera', icon: 'camera-outline', color: '#6366F1',
    route: '/(media)/camera', category: 'media', requiresAuth: true,
    isSystemApp: true, permissions: ['camera', 'microphone', 'photos'],
  },
  marketplace: {
    id: 'marketplace', name: 'Marketplace', icon: 'cart-outline', color: '#F59E0B',
    route: '/(commerce)/marketplace', category: 'commerce', requiresAuth: true,
    isSystemApp: true, permissions: ['wallet_read', 'location', 'camera', 'photos'],
  },
  shop: {
    id: 'shop', name: 'Shop', icon: 'storefront-outline', color: '#EC4899',
    route: '/(commerce)/shop', category: 'commerce', requiresAuth: true,
    isSystemApp: true, permissions: ['wallet_read', 'wallet_write', 'camera', 'photos'],
  },
  restaurant: {
    id: 'restaurant', name: 'Restaurant', icon: 'restaurant-outline', color: '#F97316',
    route: '/(os)/restaurant', category: 'commerce', requiresAuth: true,
    isSystemApp: true, permissions: ['wallet_read', 'wallet_write', 'camera'],
  },
  property: {
    id: 'property', name: 'Property', icon: 'home-outline', color: '#84CC16',
    route: '/(os)/property', category: 'commerce', requiresAuth: true,
    isSystemApp: true, permissions: ['location', 'wallet_read', 'camera', 'photos'],
  },
  transport: {
    id: 'transport', name: 'Transport', icon: 'car-outline', color: '#06B6D4',
    route: '/(transport)', category: 'transport', requiresAuth: true,
    isSystemApp: true, permissions: ['location', 'wallet_read', 'wallet_write', 'camera'],
  },
  mtruck: {
    id: 'mtruck', name: 'MTruck', icon: 'bus-outline', color: '#84CC16',
    route: '/(mtruck)', category: 'transport', requiresAuth: true,
    isSystemApp: true, permissions: ['location', 'wallet_read', 'wallet_write', 'camera'],
  },
  jobs: {
    id: 'jobs', name: 'Jobs', icon: 'briefcase-outline', color: '#6366F1',
    route: '/(work)/jobs', category: 'work', requiresAuth: true,
    isSystemApp: true, permissions: ['profile_read', 'wallet_read'],
  },
  studio: {
    id: 'studio', name: 'Studio', icon: 'videocam-outline', color: '#EF4444',
    route: '/(os)/studio', category: 'work', requiresAuth: true,
    isSystemApp: true, permissions: ['camera', 'microphone', 'wallet_read', 'wallet_write'],
  },
  binance: {
    id: 'binance', name: 'Binance', icon: 'trending-up-outline', color: '#F0B90B',
    route: '/(finance)/binance', category: 'finance', requiresAuth: true,
    isSystemApp: false, permissions: ['wallet_read', 'wallet_write'],
  },
  credit: {
    id: 'credit', name: 'Credit', icon: 'card-outline', color: '#10B981',
    route: '/(finance)/credit', category: 'finance', requiresAuth: true,
    isSystemApp: true, permissions: ['wallet_read', 'identity', 'credit_check'],
  },
  calculator: {
    id: 'calculator', name: 'Calculator', icon: 'calculator-outline', color: '#6B7280',
    route: '/(os)/calculator', category: 'tools', requiresAuth: false,
    isSystemApp: true, permissions: [],
  },
  calendar: {
    id: 'calendar', name: 'Calendar', icon: 'calendar-outline', color: '#3B82F6',
    route: '/(os)/calendar', category: 'tools', requiresAuth: true,
    isSystemApp: true, permissions: ['contacts', 'notifications'],
  },
  clock: {
    id: 'clock', name: 'Clock', icon: 'time-outline', color: '#F59E0B',
    route: '/(os)/clock', category: 'tools', requiresAuth: false,
    isSystemApp: true, permissions: ['notifications'],
  },
  reader: {
    id: 'reader', name: 'Reader', icon: 'book-outline', color: '#8B5CF6',
    route: '/(os)/reader', category: 'tools', requiresAuth: true,
    isSystemApp: true, permissions: ['photos', 'files'],
  },
  developer: {
    id: 'developer', name: 'Developer', icon: 'code-outline', color: '#6366F1',
    route: '/(os)/developer', category: 'tools', requiresAuth: true,
    isSystemApp: true, permissions: ['developer'],
  },
};

export function getOSAppById(id: string): OSAppEntry | undefined {
  return OS_APP_REGISTRY[id];
}

export function getAllOSApps(): OSAppEntry[] {
  return Object.values(OS_APP_REGISTRY);
}

export function getOSAppsByCategory(category: string): OSAppEntry[] {
  return getAllOSApps().filter((a: any) => a.category === category);
}

export function getSystemApps(): OSAppEntry[] {
  return getAllOSApps().filter((a: any) => a.isSystemApp);
}

export function getThirdPartyApps(): OSAppEntry[] {
  return getAllOSApps().filter((a: any) => !a.isSystemApp);
}

export function isSystemApp(id: string): boolean {
  return OS_APP_REGISTRY[id]?.isSystemApp ?? false;
}

export function getAppRoute(id: string): string | undefined {
  return OS_APP_REGISTRY[id]?.route;
}
