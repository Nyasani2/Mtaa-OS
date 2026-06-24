import { AppManifest } from '@/lib/kernel/registry';

export const streetsManifest: AppManifest = {
  id: 'streets',
  name: 'Streets',
  description: 'MTAA Short Video Platform — Create, discover, and share short-form videos.',
  version: '1.0.0',
  icon: 'videocam',
  category: 'social',
  author: 'MTAA OS',
  permissions: ['camera', 'microphone', 'storage', 'notifications'],
  routes: [
    { path: '/streets/feed', label: 'Feed', icon: 'home' },
    { path: '/streets/search', label: 'Search', icon: 'search' },
    { path: '/streets/studio', label: 'Studio', icon: 'musical-note' },
    { path: '/streets/notifications', label: 'Alerts', icon: 'notifications' },
    { path: '/streets/dashboard', label: 'Dashboard', icon: 'stats-chart' },
  ],
  isOSApp: false,
  installable: true,
  featured: true,
  color: '#00d4ff',
};
