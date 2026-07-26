// domains/shop/state/shopRegistry.ts
import { AppManifest } from '@/types/module.types';

export const shopManifest: AppManifest = {
  id: 'shop',
  name: 'Shop',
  description: 'E-commerce and POS system',
  version: '1.0.0',
  icon: 'shopping-cart',
  category: 'commerce',
  color: '#10B981',
  permissions: ['shop:read', 'shop:write', 'payments:read', 'payments:write'],
  entry: '/shop',
  isOSApp: true,
  size: '2.4MB',
};

export function registerShopApp(): void {
  // Register with kernel
  console.log('[ShopRegistry] Registered shop module');
}
