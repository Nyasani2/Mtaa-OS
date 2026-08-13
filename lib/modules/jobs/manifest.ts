import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'jobs',
  name: 'Jobs',
  description: 'MTAA Jobs module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/jobs'],
  permissions: ['read'],
};

const _manifest = manifest;

export default _manifest as any;
