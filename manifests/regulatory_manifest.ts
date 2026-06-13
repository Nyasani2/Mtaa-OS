import { ModuleManifest } from '../runtime/module.types';

export const regulatoryManifest: ModuleManifest = {
  id: 'regulatory',
  name: 'Regulatory',
  description: 'Tax, compliance, and business regulatory services',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'civic',
  icon: 'shield',
  color: '#F59E0B',
  entryRoute: '/(os)/regulatory',
  routes: [
    '/(os)/regulatory',
    '/(civic)/revenue',
    '/(civic)/treasury',
    '/(civic)/land',
  ],
  permissions: ['regulatory.read', 'tax.pay'],
  dependencies: ['wallet', 'auth', 'civic'],
  isOSCore: false,
  installable: true,
  minOSVersion: '1.0.0',
};
