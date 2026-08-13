// @ts-nocheck
import { ModuleManifest } from '../runtime/module.types';

export const phoneManifest: ModuleManifest = {
  id: 'phone',
  name: 'Phone',
  description: 'Contacts, dialer, and call management',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'communication',
  icon: 'phone',
  color: '#3B82F6',
  entryRoute: '/(os)/phone',
  routes: [
    '/(os)/phone',
    '/(os)/phone/contacts',
    '/(os)/phone/dialer',
    '/(os)/phone/call',
  ],
  permissions: ['contacts.read', 'phone.call'],
  dependencies: ['auth'],
  isOSCore: true,
  installable: false,
  minOSVersion: '1.0.0',
};
