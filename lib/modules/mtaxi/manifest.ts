import { AppManifest } from '@/lib/mtaa/types';

export const MTAXI_MANIFEST: AppManifest = {
  id: 'mtaxi',
  name: 'MTaxi',
  version: '3.5.0',
  description: 'Book car rides and motorcycle taxis. Request MTaxi cabs or Boda boda rides, track drivers in real-time, and pay with MTAA Wallet.',
  shortDescription: 'Book rides and manage transportation.',
  category: 'transport',
  icon: 'car-outline',
  route: '/(mtaxi)',
  developer: 'MTAA OS',
  isOSApp: true,
  requiresAuth: true,
  color: '#06B6D4',
  rating: 4.7,
  reviewCount: 2470,
  downloadCount: 74000,
  sizeMB: 17,
  permissions: ['location', 'wallet_read', 'wallet_write', 'camera'],
  featured: true,
  trending: true,
  tags: ['taxi', 'boda', 'rides', 'transport'],
};

export default MTAXI_MANIFEST;
