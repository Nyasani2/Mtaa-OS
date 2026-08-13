// @ts-nocheck
import { ModuleManifest } from '../runtime/module.types';

export const businessManifest: ModuleManifest = {
  id: 'business',
  name: 'Business Hub',
  description: 'Business analytics, ads, and merchant tools',
  version: '1.0.0',
  author: 'MTAA OS',
  category: 'productivity',
  icon: 'briefcase',
  color: '#10B981',
  entryRoute: '/(business)',
  routes: [
    '/(business)/analytics',
    '/(business)/ads',
  ],
  permissions: ['analytics.read', 'ads.manage'],
  dependencies: ['wallet', 'auth'],
  isOSCore: false,
  installable: true,
  minOSVersion: '1.0.0',
};
