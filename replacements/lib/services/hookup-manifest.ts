import type { AppManifest } from '@/types/module.types';

export const hookupManifest: AppManifest = {
  id: 'hookup',
  name: 'Hookup',
  description: 'Social connection and dating module',
  version: '1.0.0',
  icon: 'heart',
  category: 'social',
  author: 'MTAA OS',
  permissions: ['contacts:read', 'location:read', 'storage:read'],
  screens: [],
  requiresAuth: true,
  isOSApp: false,
} as any;
