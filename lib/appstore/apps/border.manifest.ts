import { AppManifest } from '@/lib/appstore/types';

export const borderManifest: AppManifest = {
  id: 'civic-border',
  name: 'Border Control',
  description: 'Border intelligence, cargo tracking, inspections, and transit corridor management',
  version: '1.0.0',
  category: 'civic',
  icon: '🛂',
  color: '#10b981',
  route: '/(os)/civic/border',
  isOSApp: false,
  permissions: ['read:border_posts', 'read:border_alerts', 'read:cargo_manifests', 'read:containers'],
  installable: true,
  sizeMB: 2.1,
};
