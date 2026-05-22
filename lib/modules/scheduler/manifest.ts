import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'scheduler',
  name: 'Scheduler',
  description: 'MTAA Scheduler module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/scheduler'],
  permissions: ['read'],
};

export default manifest;
