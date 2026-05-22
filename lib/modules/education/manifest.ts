import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'education',
  name: 'Education',
  description: 'MTAA Education module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/education'],
  permissions: ['read'],
};

export default manifest;
