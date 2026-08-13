import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'analytics',
  name: 'Analytics',
  description: 'MTAA Analytics module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/analytics'],
  permissions: ['read'],
};

const _manifest = manifest;

export default _manifest as any;
