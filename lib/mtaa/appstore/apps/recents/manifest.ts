import { AppManifest } from '../types';

export const recentsManifest: AppManifest = {
  id: 'recents',
  name: 'Recents',
  description: 'Recent apps, activities, and multitasking hub',
  version: '1.0.0',
  category: 'system',
  icon: 'layers',
  color: '#64748B',
  author: 'MTAA OS',
  size: '1MB',
  rating: 4.0,
  installs: 0,
  isOSBased: true,
  entryPoint: '/(os)/recents',
  permissions: [],
  screens: [
    { route: '/(os)/recents', label: 'Recents', icon: 'layers' },
  ],
  features: [
    'View recently used apps',
    'Quick switch between open apps',
    'Clear all recent apps',
    'App usage statistics',
  ],
  minOSVersion: '1.0.0',
  supportedPlatforms: ['ios', 'android', 'web'],
  requiresAuth: false,
  hasInAppPurchases: false,
  dataUsage: 'none',
  offlineSupport: true,
};
