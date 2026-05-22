import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'marketplace',
  name: 'Marketplace',
  description: 'MTAA Marketplace module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/marketplace'],
  permissions: ['read'],
};

export default manifest;
