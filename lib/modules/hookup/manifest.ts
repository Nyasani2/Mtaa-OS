import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'hookup',
  name: 'Hookup',
  description: 'MTAA Hookup module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/hookup'],
  permissions: ['read'],
};

export default manifest;
