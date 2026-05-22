import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'clock',
  name: 'Clock',
  description: 'MTAA Clock module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/clock'],
  permissions: ['read'],
};

export default manifest;
