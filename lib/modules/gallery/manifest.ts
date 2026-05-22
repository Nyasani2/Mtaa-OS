import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'gallery',
  name: 'Gallery',
  description: 'MTAA Gallery module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/gallery'],
  permissions: ['read'],
};

export default manifest;
