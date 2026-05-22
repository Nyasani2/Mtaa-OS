import { AppManifest } from '@/lib/appstore/types';

export const customsManifest: AppManifest = {
  id: 'civic-customs',
  name: 'Customs & Excise',
  description: 'KRA Customs — entries, tariffs, bonded warehouses, excise licenses & inspections',
  version: '1.0.0',
  category: 'civic',
  icon: '🛃',
  color: '#ef4444',
  route: '/(os)/civic/customs',
  isOSApp: false,
  permissions: ['read:customs_entries', 'read:tariff_schedule', 'read:bonded_warehouses', 'read:excise_licenses', 'read:customs_inspections'],
  installable: true,
  sizeMB: 2.5,
};
