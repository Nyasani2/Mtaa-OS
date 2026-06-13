import { ModuleManifest } from '../runtime/module.types';

export const propertyManifest: ModuleManifest = {
  id: 'property',
  name: 'Property',
  description: 'Real estate listings, bookings, and property management',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'lifestyle',
  icon: 'home',
  color: '#8B5CF6',
  entryRoute: '/(os)/property',
  routes: [
    '/(os)/property',
    '/(os)/property/search',
    '/(os)/property/booking',
    '/(os)/property/list-property',
  ],
  permissions: ['property.read', 'property.write'],
  dependencies: ['wallet', 'auth'],
  isOSCore: false,
  installable: true,
  minOSVersion: '1.0.0',
};
