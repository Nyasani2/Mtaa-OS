import { ModuleManifest } from '../runtime/module.types';

export const pulseManifest: ModuleManifest = {
  id: 'pulse',
  name: 'Pulse',
  description: 'News, trends, alerts, and community feed',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'media',
  icon: 'activity',
  color: '#EF4444',
  entryRoute: '/(os)/pulse',
  routes: [
    '/(os)/pulse',
    '/(os)/pulse/discover',
    '/(os)/pulse/trending',
    '/(os)/pulse/alerts',
    '/(os)/pulse/events',
    '/(os)/pulse/communities',
    '/(os)/pulse/creator',
    '/(os)/pulse/search',
  ],
  permissions: ['pulse.read', 'pulse.publish'],
  dependencies: ['auth'],
  isOSCore: true,
  installable: false,
  minOSVersion: '1.0.0',
};
