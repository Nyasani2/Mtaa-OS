import { AppManifest } from '@/types/module.types';

export const garageManifest: AppManifest = {
  id: 'garage',
  name: 'Garage OS',
  description: 'Full garage management: OBD-II diagnostics, work orders, inventory, fleet, and customer portal.',
  version: '2.0.0',
  icon: '🔧',
  category: 'automotive',
  color: '#3B82F6',
  author: 'MTAA OS',
  permissions: ['location', 'camera', 'notifications'],
  entry: '/(garage)',
  isOSApp: false,
  size: '24 MB',
  isSystemApp: false,
  isLocalApp: true,
};
