import { ModuleManifest } from '../runtime/module.types';

const pulseManifest: ModuleManifest = {
  name: 'Pulse',
  description: 'News, trends, alerts, and community feed',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'media',
  icon: 'activity',
  color: '#EF4444',
  routes: [
  ],
  dependencies: ['auth'],
  isOSCore: true,
  installable: false,
  minOSVersion: '1.0.0',
};

export default pulseManifest;