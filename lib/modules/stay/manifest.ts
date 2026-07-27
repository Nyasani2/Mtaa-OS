import { ModuleManifest } from '../runtime/module.types';

export const stayManifest: ModuleManifest = {
  id: 'stay',
  name: 'Stay',
  description: 'Find and book stays, rentals, and accommodations',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'lifestyle',
  icon: 'home',
  color: '#1a5c4b',
  entryRoute: '/(os)/stay',
  routes: [
    '/(os)/stay',
    '/(os)/stay/search',
    '/(os)/stay/booking',
    '/(os)/stay/list-property',
  ],
  permissions: ['stay.read', 'stay.write'],
  dependencies: ['wallet', 'auth'],
  isOSCore: false,
  installable: true,
  minOSVersion: '1.0.0',
};
