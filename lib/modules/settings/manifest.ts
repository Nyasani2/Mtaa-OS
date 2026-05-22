import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'settings',
  name: 'Settings',
  description: 'MTAA Settings module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/settings'],
  permissions: ['read'],
};

export default manifest;
