/**
 * MTAA App Catalog — Single Source of Truth
 *
 * This is the real, canonical registry of every launchable app in MTAA OS.
 * It was previously defined locally inside app/(os)/index.tsx (the home
 * screen component) and invisible to everything else — the AppStore
 * screen, search, kernel boot tracking, and the standalone registry files
 * under lib/kernel/registry/* all had no access to it and maintained
 * their own separate, smaller, out-of-sync lists instead.
 *
 * Extracted 2026-07-17 so any part of the app can import ALL_APPS and get
 * the real, current catalog instead of guessing or duplicating it.
 *
 * NOTE on other "registry" files in this codebase:
 * - apps.registry.json (repo root): only 4 entries, unclear if anything
 *   reads it. NOT the source for the home screen. Needs a decision:
 *   is this for a different purpose (e.g. AppStore-installable apps
 *   specifically, per the "OS apps vs AppStore apps" architecture
 *   mentioned in project docs), or is it simply stale? Left untouched.
 * - lib/kernel/registry.ts: a dynamic in-memory Map. registerApp() is
 *   ONLY ever called from test/audit screens (kernel-audit.tsx, admin.tsx)
 *   registering a fake testManifest — it holds no real app data in
 *   normal use. Left untouched; may be intended for future dynamic
 *   module loading.
 * - lib/kernel/registry/kernel-registry.ts: boot-health tracking (status,
 *   lastBooted, errorCount) built on top of the above Map. Also inert
 *   in current usage for the same reason. Left untouched.
 * - lib/kernel/registry/index.ts: a separate static 11-app list, used
 *   only by kernel-audit.tsx and lib/services/hookup-manifest.ts.
 *   Smaller and different in shape from this catalog. Needs a human
 *   decision on whether hookup-manifest.ts should migrate to this file.
 */

export interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons';
  route: string;
  color: string;
  bgColor: string;
  ownerOnly: boolean;
}

// ─── APPS TO HIDE FROM HOME (Civic paused, nested sub-apps) ───
export const HIDDEN_APP_IDS = new Set([
  // Civic apps — PAUSED until launch
  'civic', 'courts', 'prisons', 'police', 'immigration', 'land', 'transport',
  // Health sub-apps — nested inside Health OS
  'ambulance', 'doctor', 'find-care', 'hospital', 'lab', 'nurse', 'pharmacy',
  'radiology', 'telemedicine', 'emergency', 'records', 'insurance', 'dispatch',
  // Wallet sub-apps — nested inside Wallet
  'savings', 'topup', 'transfer', 'withdraw', 'scan', 'gofund', 'onboarding',
  // Other nested apps
  'portfolio', 'qr', 'documents',
  // Admin-only (already filtered by ownerOnly, but belt-and-suspenders)
  'central-bank', 'command-centre', 'regulatory', 'revenue', 'developer',
]);

export const ALL_APPS: AppTile[] = [
  { id: 'ads', name: 'Ads', icon: 'megaphone', iconSet: 'Ionicons', route: '/(business)/ads', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'ambulance', name: 'Ambulance', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/ambulance', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'appstore', name: 'App Store', icon: 'apps', iconSet: 'Ionicons', route: '/(os)/appstore', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'asis', name: 'ASIS', icon: 'hardware-chip', iconSet: 'Ionicons', route: '/(os)/asis', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'binance', name: 'Binance', icon: 'logo-bitcoin', iconSet: 'Ionicons', route: '/(finance)/binance', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'boda', name: 'Boda', icon: 'bicycle', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'calculator', name: 'Calculator', icon: 'calculator', iconSet: 'Ionicons', route: '/(os)/calculator', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', iconSet: 'Ionicons', route: '/(os)/calendar', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'camera', name: 'Camera', icon: 'camera', iconSet: 'Ionicons', route: '/(media)/camera', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'central-bank', name: 'Central Bank', icon: 'bank', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre/treasury/central-bank', color: '#fff', bgColor: '#1e40af', ownerOnly: true },
  { id: 'civic', name: 'Civic', icon: 'shield-check', iconSet: 'MaterialCommunityIcons', route: '/(civic)', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'clock', name: 'Clock', icon: 'time', iconSet: 'Ionicons', route: '/(os)/clock', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'command-centre', name: 'Command Centre', icon: 'desktop-tower-monitor', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre', color: '#fff', bgColor: '#8b5cf6', ownerOnly: true },
  { id: 'contacts', name: 'Contacts', icon: 'people', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'courts', name: 'Courts', icon: 'scale', iconSet: 'MaterialCommunityIcons', route: '/(civic)/courts', color: '#fff', bgColor: '#7c3aed', ownerOnly: false },
  { id: 'credit', name: 'Credit', icon: 'card', iconSet: 'Ionicons', route: '/(finance)/credit', color: '#fff', bgColor: '#10b981', ownerOnly: false },
  { id: 'developer', name: 'Dev', icon: 'code-slash', iconSet: 'Ionicons', route: '/(os)/developer', color: '#fff', bgColor: '#334155', ownerOnly: true },
  { id: 'dispatch', name: 'Dispatch', icon: 'navigate', iconSet: 'Ionicons', route: '/(os)/health/ambulance/dispatch', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
  { id: 'doctor', name: 'Doctor', icon: 'medkit', iconSet: 'Ionicons', route: '/(os)/health/doctor', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'documents', name: 'Documents', icon: 'document', iconSet: 'Ionicons', route: '/(os)/profile/documents', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'edu', name: 'Edu', icon: 'school', iconSet: 'Ionicons', route: '/(education)', color: '#fff', bgColor: '#14b8a6', ownerOnly: false },
  { id: 'emergency', name: 'Emergency', icon: 'warning', iconSet: 'Ionicons', route: '/(os)/health/emergency', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
  { id: 'find-care', name: 'Find Care', icon: 'search', iconSet: 'Ionicons', route: '/(os)/health/find-care', color: '#fff', bgColor: '#0891b2', ownerOnly: false },
  { id: 'gallery', name: 'Gallery', icon: 'images', iconSet: 'Ionicons', route: '/(media)/gallery', color: '#fff', bgColor: '#ec4899', ownerOnly: false },
  { id: 'garage', name: 'Garage', icon: 'car-wrench', iconSet: 'MaterialCommunityIcons', route: '/(garage)', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'gofund', name: 'GoFund', icon: 'heart-circle', iconSet: 'Ionicons', route: '/(os)/wallet/gofund', color: '#fff', bgColor: '#f43f5e', ownerOnly: false },
  { id: 'government', name: 'Government', icon: 'business', iconSet: 'Ionicons', route: '/(os)/health/government', color: '#fff', bgColor: '#1e40af', ownerOnly: false },
  { id: 'health', name: 'Health', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'hookup', name: 'Hookup', icon: 'heart', iconSet: 'Ionicons', route: '/(social)/hookup', color: '#fff', bgColor: '#f43f5e', ownerOnly: false },
  { id: 'hospital', name: 'Hospital', icon: 'fitness', iconSet: 'Ionicons', route: '/(os)/health/hospital-admin', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'immigration', name: 'Immigration', icon: 'airplane', iconSet: 'Ionicons', route: '/(civic)/immigration', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'insurance', name: 'Insurance', icon: 'shield', iconSet: 'Ionicons', route: '/(os)/health/insurance', color: '#fff', bgColor: '#059669', ownerOnly: false },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'lab', name: 'Lab', icon: 'flask', iconSet: 'Ionicons', route: '/(os)/health/lab', color: '#fff', bgColor: '#a855f7', ownerOnly: false },
  { id: 'land', name: 'Land', icon: 'map', iconSet: 'Ionicons', route: '/(civic)/land', color: '#fff', bgColor: '#84cc16', ownerOnly: false },
  { id: 'marketplace', name: 'Market', icon: 'cart', iconSet: 'Ionicons', route: '/(commerce)/marketplace', color: '#fff', bgColor: '#84cc16', ownerOnly: false },
  { id: 'messages', name: 'Messages', icon: 'chatbubble', iconSet: 'Ionicons', route: '/(communication)/messages', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'mtaxi', name: 'MTaxi', icon: 'car', iconSet: 'Ionicons', route: '/(mtaxi)', color: '#fff', bgColor: '#10b981', ownerOnly: false },
  { id: 'mtruck', name: 'MTruck', icon: 'truck-delivery', iconSet: 'MaterialCommunityIcons', route: '/(mtruck)', color: '#fff', bgColor: '#a855f7', ownerOnly: false },
  { id: 'network', name: 'Network', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/network', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', iconSet: 'Ionicons', route: '/(os)/wallet/onboarding', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'phone', name: 'Phone', icon: 'call', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/pharmacy', color: '#fff', bgColor: '#14b8a6', ownerOnly: false },
  { id: 'police', name: 'Police', icon: 'shield', iconSet: 'Ionicons', route: '/(civic)/police', color: '#fff', bgColor: '#1e40af', ownerOnly: false },
  { id: 'portfolio', name: 'Portfolio', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs/portfolio', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'prisons', name: 'Prisons', icon: 'lock-closed', iconSet: 'Ionicons', route: '/(civic)/prisons', color: '#fff', bgColor: '#7c2d12', ownerOnly: false },
  { id: 'profile', name: 'Profile', icon: 'person', iconSet: 'Ionicons', route: '/(os)/profile', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'property', name: 'Property', icon: 'home', iconSet: 'Ionicons', route: '/(os)/property', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'qr', name: 'QR', icon: 'qr-code', iconSet: 'Ionicons', route: '/(os)/profile/qr', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'radiology', name: 'Radiology', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/health/radiology', color: '#fff', bgColor: '#8b5cf6', ownerOnly: false },
  { id: 'reader', name: 'Reader', icon: 'book', iconSet: 'Ionicons', route: '/(os)/reader', color: '#fff', bgColor: '#059669', ownerOnly: false },
  { id: 'records', name: 'Records', icon: 'folder', iconSet: 'Ionicons', route: '/(os)/health/records', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'regulatory', name: 'Regulatory', icon: 'document-text', iconSet: 'Ionicons', route: '/(os)/regulatory', color: '#fff', bgColor: '#7c3aed', ownerOnly: true },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', iconSet: 'Ionicons', route: '/(os)/restaurant', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'revenue', name: 'Revenue', icon: 'cash', iconSet: 'Ionicons', route: '/(admin)/command-centre/revenue', color: '#fff', bgColor: '#059669', ownerOnly: true },
  { id: 'savings', name: 'Savings', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet/savings', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'scan', name: 'Scan', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/wallet/scan', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'search', name: 'Search', icon: 'search', iconSet: 'Ionicons', route: '/(os)/search', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'settings', name: 'Settings', icon: 'settings', iconSet: 'Ionicons', route: '/(os)/settings', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'shop', name: 'Shop', icon: 'storefront', iconSet: 'Ionicons', route: '/(commerce)/shop', color: '#fff', bgColor: '#ec4899', ownerOnly: false },
  { id: 'streets', name: 'Streets', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/streets', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'studio', name: 'Studio', icon: 'film', iconSet: 'Ionicons', route: '/(os)/studio', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'telemedicine', name: 'Telemed', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/health/telemedicine', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'topup', name: 'Top Up', icon: 'add-circle', iconSet: 'Ionicons', route: '/(os)/wallet/top-up', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', iconSet: 'Ionicons', route: '/(os)/wallet/transfer', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'transport', name: 'Transport', icon: 'bus', iconSet: 'Ionicons', route: '/(civic)/transport', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'tribes', name: 'Tribes', icon: 'people', iconSet: 'Ionicons', route: '/(os)/tribes', color: '#fff', bgColor: '#d946ef', ownerOnly: false },
  { id: 'upload', name: 'Upload', icon: 'cloud-upload', iconSet: 'Ionicons', route: '/(os)/upload', color: '#fff', bgColor: '#0891b2', ownerOnly: false },
  { id: 'wallet', name: 'Wallet', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'wifi', name: 'WiFi', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/wifi', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'withdraw', name: 'Withdraw', icon: 'arrow-down-circle', iconSet: 'Ionicons', route: '/(os)/wallet/withdraw', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
];

export function getVisibleApps(): AppTile[] {
  return ALL_APPS.filter(app => !HIDDEN_APP_IDS.has(app.id));
}

export function getAppById(id: string): AppTile | undefined {
  return ALL_APPS.find(app => app.id === id);
}
