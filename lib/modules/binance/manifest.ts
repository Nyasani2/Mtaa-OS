import { AppManifest } from '@/lib/apps-store/types';

export const manifest: AppManifest = {
  id: 'binance',
  name: 'Binance',
  description: 'MTAA Binance module',
  version: '1.0.0',
  icon: 'box',
  category: 'utility',
  author: 'MTAA',
  entryPoint: './index',
  routes: ['/binance'],
  permissions: ['read'],
};

export default manifest;
