import { AppManifest } from '@/lib/appstore/types';

export const immigrationManifest: AppManifest = {
  id: 'civic-immigration',
  name: 'Immigration Services',
  description: 'Department of Immigration — passports, visas, permits, border crossings & overstays',
  version: '1.0.0',
  category: 'civic',
  icon: '🛂',
  color: '#8b5cf6',
  route: '/(os)/civic/immigration',
  isOSApp: false,
  permissions: ['read:passports', 'read:visas', 'read:work_permits', 'read:border_crossings', 'read:overstays'],
  installable: true,
  sizeMB: 2.3,
};
