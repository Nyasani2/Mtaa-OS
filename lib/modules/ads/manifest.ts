import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'ads',
  name: 'Ads',
  description: 'MTAA Ads module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/ads'],
  permissions: ['read'],
};

const _manifest = manifest;

export default _manifest as any;
