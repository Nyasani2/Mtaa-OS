import { AppManifest } from '@/lib/app-registry';

export const mstudioManifest: AppManifest = {
  id: 'mstudio',
  name: 'MStudio',
  description: 'Video, live streaming, and creator platform',
  icon: 'play-circle',
  category: 'media',
  color: '#FF2D55',
  route: '/(os)/studio',
  isSystemApp: false,
  version: '1.0.0',
  permissions: ['studio_videos', 'studio_live_streams', 'streets_posts'],
};
