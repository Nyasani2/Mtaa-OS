import { AppManifest } from './types';

export const SYSTEM_APPS: AppManifest[] = [
  { id: 'wallet', name: 'Wallet', domain: 'wallet', version: '1.0.0', entry: '/(os)/wallet', icon: '💰', color: '#10B981', system_app: true, installable: false, enabled: true, permissions: [], routes: [], dependencies: [] },
  { id: 'health', name: 'Health', domain: 'health', version: '1.0.0', entry: '/(os)/health', icon: '🏥', color: '#EF4444', system_app: true, installable: false, enabled: true, permissions: [], routes: [], dependencies: [] },
  { id: 'settings', name: 'Settings', domain: 'settings', version: '1.0.0', entry: '/(os)/settings', icon: '⚙️', color: '#6B7280', system_app: true, installable: false, enabled: true, permissions: [], routes: [], dependencies: [] },
  { id: 'clock', name: 'Clock', domain: 'clock', version: '1.0.0', entry: '/(os)/clock', icon: '🕐', color: '#3B82F6', system_app: true, installable: false, enabled: true, permissions: [], routes: [], dependencies: [] },
  { id: 'scheduler', name: 'Calendar', domain: 'scheduler', version: '1.0.0', entry: '/(os)/calendar', icon: '📅', color: '#F59E0B', system_app: true, installable: false, enabled: true, permissions: [], routes: [], dependencies: [] },
];

export const APP_STORE_REGISTRY: AppManifest[] = [
  { id: 'mtaxi', name: 'MTaxi', domain: 'mtaxi', version: '1.0.0', entry: '/(os)/mtaxi', icon: '🚕', color: '#F59E0B', system_app: false, installable: true, enabled: true, permissions: ['location','notifications'], routes: ['/ride','/history','/driver'], dependencies: ['wallet'] },
  { id: 'mtruck', name: 'MTruck', domain: 'mtruck', version: '1.0.0', entry: '/(os)/mtruck', icon: '🚛', color: '#8B5CF6', system_app: false, installable: true, enabled: true, permissions: ['location','notifications'], routes: ['/loads','/trucks','/history'], dependencies: ['wallet'] },
  { id: 'tribes', name: 'Tribes', domain: 'tribes', version: '1.0.0', entry: '/(os)/tribes', icon: '👥', color: '#EC4899', system_app: false, installable: true, enabled: true, permissions: ['contacts','notifications'], routes: ['/feed','/groups','/discover'], dependencies: [] },
  { id: 'shop', name: 'Shop', domain: 'shop', version: '1.0.0', entry: '/(os)/shop', icon: '🛒', color: '#3B82F6', system_app: false, installable: true, enabled: true, permissions: ['camera','notifications'], routes: ['/browse','/orders','/store'], dependencies: ['wallet'] },
  { id: 'marketplace', name: 'Marketplace', domain: 'marketplace', version: '1.0.0', entry: '/(os)/marketplace', icon: '🏪', color: '#14B8A6', system_app: false, installable: true, enabled: true, permissions: ['camera','notifications'], routes: ['/listings','/orders','/messages'], dependencies: ['wallet'] },
  { id: 'jobs', name: 'Jobs', domain: 'jobs', version: '1.0.0', entry: '/(os)/jobs', icon: '💼', color: '#F97316', system_app: false, installable: true, enabled: true, permissions: ['notifications'], routes: ['/feed','/applications','/post'], dependencies: [] },
  { id: 'streets', name: 'Streets', domain: 'streets', version: '1.0.0', entry: '/(os)/streets', icon: '📹', color: '#EF4444', system_app: false, installable: true, enabled: true, permissions: ['camera','microphone','notifications'], routes: ['/feed','/live','/profile'], dependencies: [] },
  { id: 'education', name: 'Education', domain: 'education', version: '1.0.0', entry: '/(os)/education', icon: '🎓', color: '#6366F1', system_app: false, installable: true, enabled: true, permissions: ['notifications'], routes: ['/courses','/enrolled','/certificates'], dependencies: [] },
  { id: 'hookup', name: 'Hookup', domain: 'hookup', version: '1.0.0', entry: '/(os)/hookup', icon: '💘', color: '#EC4899', system_app: false, installable: true, enabled: true, permissions: ['location','notifications'], routes: ['/discover','/matches','/messages'], dependencies: [] },
  { id: 'restaurant', name: 'Restaurant', domain: 'restaurant', version: '1.0.0', entry: '/(os)/restaurant', icon: '🍽️', color: '#F97316', system_app: false, installable: true, enabled: true, permissions: ['camera','notifications','location'], routes: ['/dashboard','/pos','/kds','/tables','/menu','/inventory','/staff','/payroll','/reports','/delivery','/customers','/settings','/asis'], dependencies: ['wallet'] },
  { id: 'garage', name: 'Garage OS', domain: 'garage', version: '2.0.0', entry: '/(garage)', icon: '🔧', color: '#3B82F6', system_app: false, installable: true, enabled: true, permissions: ['location','camera','notifications',], routes: ['/onboarding','/dashboard','/diagnostics','/appointments','/inventory','/fleet','/customer'], dependencies: ['wallet','health'] },
];

export const UNIFIED_REGISTRY: AppManifest[] = [...SYSTEM_APPS, ...APP_STORE_REGISTRY];

export function getAppById(id: string): AppManifest | undefined {
  return UNIFIED_REGISTRY.find(a => a.id === id);
}

export function getInstallableApps(): AppManifest[] {
  return UNIFIED_REGISTRY.filter(a => a.installable && !a.system_app);
}

export function getSystemApps(): AppManifest[] {
  return UNIFIED_REGISTRY.filter(a => a.system_app);
}
