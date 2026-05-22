import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'mtruck',
  name: 'Mtruck',
  description: 'MTAA Mtruck module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/mtruck'],
  permissions: ['read'],
};

export default manifest;
