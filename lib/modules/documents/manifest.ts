import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'documents',
  name: 'Documents',
  description: 'MTAA Documents module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/documents'],
  permissions: ['read'],
};

export default manifest;
