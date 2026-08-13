import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'restaurant',
  name: 'Restaurant',
  description: 'Full restaurant management: POS, KDS, inventory, staff, payroll, reports',
  version: '1.0.0',
  icon: 'utensils',
  category: 'business',
  author: 'MTAA',
  entryPoint: './index',
  routes: [
    '/dashboard',
    '/pos',
    '/kds',
    '/tables',
    '/menu',
    '/inventory',
    '/staff',
    '/payroll',
    '/reports',
    '/delivery',
    '/customers',
    '/settings',
    '/asis',
  ],
  permissions: ['camera', 'notifications', 'location', 'storage'],
};

const _manifest = manifest;

export default _manifest as any;
