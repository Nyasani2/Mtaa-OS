import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'messages',
  name: 'Messages',
  description: 'MTAA Messages module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/messages'],
  permissions: ['read'],
};

const _manifest = manifest;

export default _manifest as any;
