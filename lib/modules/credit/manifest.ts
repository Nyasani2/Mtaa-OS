import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'credit',
  name: 'Credit',
  description: 'MTAA Credit module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/credit'],
  permissions: ['read'],
};

export default manifest;
