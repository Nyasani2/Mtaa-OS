import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'revenue',
  name: 'Revenue',
  description: 'MTAA Revenue module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/revenue'],
  permissions: ['read'],
};

export default manifest;
