import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'health',
  name: 'Health',
  description: 'MTAA Health module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/health'],
  permissions: ['read'],
};

export default manifest;
