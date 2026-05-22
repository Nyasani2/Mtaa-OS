import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'mtaxi',
  name: 'Mtaxi',
  description: 'MTAA Mtaxi module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/mtaxi'],
  permissions: ['read'],
};

export default manifest;
