import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'recents',
  name: 'Recents',
  description: 'MTAA Recents module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/recents'],
  permissions: ['read'],
};

export default manifest;
