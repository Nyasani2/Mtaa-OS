// ============================================================
// MTAA OS V10 — App Catalog (Verified Against Actual File Structure)
// Routes matched to real files in app/ directory
// Last verified: 2026-07-17
// ============================================================

export interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome' | 'Feather';
  route: string;
  color: string;
  bgColor: string;
  ownerOnly: boolean;
  badge?: number;
  isNew?: boolean;
  category?: string;
  status: 'live' | 'missing' | 'stub';
}

// ─── Domain Categories ───
export const APP_CATEGORIES = {
  OS: 'Operating System',
  FINANCE: 'Finance',
  COMMERCE: 'Commerce',
  CIVIC: 'Civic Services',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  WORK: 'Work & Jobs',
  SOCIAL: 'Social',
  MEDIA: 'Media',
  ADMIN: 'Administration',
  TRANSPORT: 'Transport',
  UTILITY: 'Utility',
} as const;

// ─── Verified App List (74 apps) ───
// Routes verified against actual files in app/ directory
// Status: live = file exists, missing = no index.tsx found, stub = placeholder
export const ALL_APPS: AppTile[] = [
  // ─── OS (12 apps) ───
  { id: 'appstore', name: 'App Store', icon: 'apps', iconSet: 'Ionicons', route: '/(os)/appstore', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'asis', name: 'ASIS', icon: 'hardware-chip', iconSet: 'Ionicons', route: '/(os)/asis', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'calculator', name: 'Calculator', icon: 'calculator', iconSet: 'Ionicons', route: '/(os)/calculator', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', iconSet: 'Ionicons', route: '/(os)/calendar', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'clock', name: 'Clock', icon: 'time', iconSet: 'Ionicons', route: '/(os)/clock', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'contacts', name: 'Contacts', icon: 'people', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'developer', name: 'Dev', icon: 'code-slash', iconSet: 'Ionicons', route: '/(os)/developer', color: '#fff', bgColor: '#334155', ownerOnly: true, category: 'OS', status: 'live' },
  { id: 'network', name: 'Network', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/network', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'phone', name: 'Phone', icon: 'call', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#22c55e', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'profile', name: 'Profile', icon: 'person', iconSet: 'Ionicons', route: '/(os)/profile', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'settings', name: 'Settings', icon: 'settings', iconSet: 'Ionicons', route: '/(os)/settings', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'search', name: 'Search', icon: 'search', iconSet: 'Ionicons', route: '/(os)/search', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'OS', status: 'missing' },

  // ─── HEALTH (10 apps) ───
  { id: 'ambulance', name: 'Ambulance', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/ambulance', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'dispatch', name: 'Dispatch', icon: 'navigate', iconSet: 'Ionicons', route: '/(os)/health/ambulance/dispatch', color: '#fff', bgColor: '#dc2626', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'doctor', name: 'Doctor', icon: 'medkit', iconSet: 'Ionicons', route: '/(os)/health/doctor', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'emergency', name: 'Emergency', icon: 'warning', iconSet: 'Ionicons', route: '/(os)/health/emergency', color: '#fff', bgColor: '#dc2626', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'find-care', name: 'Find Care', icon: 'search', iconSet: 'Ionicons', route: '/(os)/health/find-care', color: '#fff', bgColor: '#0891b2', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'health', name: 'Health', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'hospital', name: 'Hospital', icon: 'fitness', iconSet: 'Ionicons', route: '/(os)/health/hospital-admin', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'insurance', name: 'Insurance', icon: 'shield', iconSet: 'Ionicons', route: '/(os)/health/insurance', color: '#fff', bgColor: '#059669', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'lab', name: 'Lab', icon: 'flask', iconSet: 'Ionicons', route: '/(os)/health/lab', color: '#fff', bgColor: '#a855f7', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/pharmacy', color: '#fff', bgColor: '#14b8a6', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'radiology', name: 'Radiology', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/health/radiology', color: '#fff', bgColor: '#8b5cf6', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'records', name: 'Records', icon: 'folder', iconSet: 'Ionicons', route: '/(os)/health/records', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'HEALTH', status: 'live' },
  { id: 'telemedicine', name: 'Telemed', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/health/telemedicine', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'HEALTH', status: 'live' },

  // ─── FINANCE (10 apps) ───
  { id: 'binance', name: 'Binance', icon: 'logo-bitcoin', iconSet: 'Ionicons', route: '/(finance)/binance', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'credit', name: 'Credit', icon: 'card', iconSet: 'Ionicons', route: '/(finance)/credit', color: '#fff', bgColor: '#10b981', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'gofund', name: 'GoFund', icon: 'heart-circle', iconSet: 'Ionicons', route: '/(os)/wallet/gofund', color: '#fff', bgColor: '#f43f5e', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', iconSet: 'Ionicons', route: '/(os)/wallet/onboarding', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'savings', name: 'Savings', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet/savings', color: '#fff', bgColor: '#22c55e', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'scan', name: 'Scan', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/wallet/scan', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'topup', name: 'Top Up', icon: 'add-circle', iconSet: 'Ionicons', route: '/(os)/wallet/top-up', color: '#fff', bgColor: '#22c55e', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', iconSet: 'Ionicons', route: '/(os)/wallet/transfer', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'wallet', name: 'Wallet', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'withdraw', name: 'Withdraw', icon: 'arrow-down-circle', iconSet: 'Ionicons', route: '/(os)/wallet/withdraw', color: '#fff', bgColor: '#dc2626', ownerOnly: false, category: 'FINANCE', status: 'live' },

  // ─── COMMERCE (4 apps) ───
  { id: 'ads', name: 'Ads', icon: 'megaphone', iconSet: 'Ionicons', route: '/(business)/ads', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'marketplace', name: 'Market', icon: 'cart', iconSet: 'Ionicons', route: '/(commerce)/marketplace', color: '#fff', bgColor: '#84cc16', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', iconSet: 'Ionicons', route: '/(os)/restaurant', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'shop', name: 'Shop', icon: 'storefront', iconSet: 'Ionicons', route: '/(commerce)/shop', color: '#fff', bgColor: '#ec4899', ownerOnly: false, category: 'COMMERCE', status: 'live' },

  // ─── CIVIC (7 apps) ───
  { id: 'civic', name: 'Civic', icon: 'shield-check', iconSet: 'MaterialCommunityIcons', route: '/(civic)', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'CIVIC', status: 'missing' },
  { id: 'courts', name: 'Courts', icon: 'scale', iconSet: 'MaterialCommunityIcons', route: '/(civic)/courts', color: '#fff', bgColor: '#7c3aed', ownerOnly: false, category: 'CIVIC', status: 'live' },
  { id: 'immigration', name: 'Immigration', icon: 'airplane', iconSet: 'Ionicons', route: '/(civic)/immigration', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'CIVIC', status: 'live' },
  { id: 'land', name: 'Land', icon: 'map', iconSet: 'Ionicons', route: '/(civic)/land', color: '#fff', bgColor: '#84cc16', ownerOnly: false, category: 'CIVIC', status: 'missing' },
  { id: 'police', name: 'Police', icon: 'shield', iconSet: 'Ionicons', route: '/(civic)/police', color: '#fff', bgColor: '#1e40af', ownerOnly: false, category: 'CIVIC', status: 'live' },
  { id: 'prisons', name: 'Prisons', icon: 'lock-closed', iconSet: 'Ionicons', route: '/(civic)/prisons', color: '#fff', bgColor: '#7c2d12', ownerOnly: false, category: 'CIVIC', status: 'live' },
  { id: 'transport', name: 'Transport', icon: 'bus', iconSet: 'Ionicons', route: '/(civic)/transport', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'CIVIC', status: 'live' },

  // ─── TRANSPORT (4 apps) ───
  { id: 'boda', name: 'Boda', icon: 'bicycle', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#22c55e', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'garage', name: 'Garage', icon: 'car-wrench', iconSet: 'MaterialCommunityIcons', route: '/(garage)', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'mtaxi', name: 'MTaxi', icon: 'car', iconSet: 'Ionicons', route: '/(mtaxi)', color: '#fff', bgColor: '#10b981', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'mtruck', name: 'MTruck', icon: 'truck-delivery', iconSet: 'MaterialCommunityIcons', route: '/(mtruck)', color: '#fff', bgColor: '#a855f7', ownerOnly: false, category: 'TRANSPORT', status: 'live' },

  // ─── SOCIAL (4 apps) ───
  { id: 'hookup', name: 'Hookup', icon: 'heart', iconSet: 'Ionicons', route: '/(os)/hookup', color: '#fff', bgColor: '#f43f5e', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'messages', name: 'Messages', icon: 'chatbubble', iconSet: 'Ionicons', route: '/(communication)/messages', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'streets', name: 'Streets', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/streets', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'tribes', name: 'Tribes', icon: 'people', iconSet: 'Ionicons', route: '/(os)/tribes', color: '#fff', bgColor: '#d946ef', ownerOnly: false, category: 'SOCIAL', status: 'live' },

  // ─── MEDIA (3 apps) ───
  { id: 'camera', name: 'Camera', icon: 'camera', iconSet: 'Ionicons', route: '/(media)/camera', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'MEDIA', status: 'live' },
  { id: 'gallery', name: 'Gallery', icon: 'images', iconSet: 'Ionicons', route: '/(media)/gallery', color: '#fff', bgColor: '#ec4899', ownerOnly: false, category: 'MEDIA', status: 'live' },
  { id: 'studio', name: 'Studio', icon: 'film', iconSet: 'Ionicons', route: '/(os)/studio', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'MEDIA', status: 'missing' },
  { id: 'upload', name: 'Upload', icon: 'cloud-upload', iconSet: 'Ionicons', route: '/(os)/upload', color: '#fff', bgColor: '#0891b2', ownerOnly: false, category: 'MEDIA', status: 'live' },

  // ─── WORK (3 apps) ───
  { id: 'jobs', name: 'Jobs', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'WORK', status: 'live' },
  { id: 'portfolio', name: 'Portfolio', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs/portfolio', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'WORK', status: 'live' },

  // ─── EDUCATION (1 app) ───
  { id: 'edu', name: 'Edu', icon: 'school', iconSet: 'Ionicons', route: '/(education)', color: '#fff', bgColor: '#14b8a6', ownerOnly: false, category: 'EDUCATION', status: 'live' },

  // ─── ADMIN (3 apps) ───
  { id: 'central-bank', name: 'Central Bank', icon: 'bank', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre/treasury/central-bank', color: '#fff', bgColor: '#1e40af', ownerOnly: true, category: 'ADMIN', status: 'live' },
  { id: 'command-centre', name: 'Command Centre', icon: 'desktop-tower-monitor', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre', color: '#fff', bgColor: '#8b5cf6', ownerOnly: true, category: 'ADMIN', status: 'live' },
  { id: 'regulatory', name: 'Regulatory', icon: 'document-text', iconSet: 'Ionicons', route: '/(os)/regulatory', color: '#fff', bgColor: '#7c3aed', ownerOnly: true, category: 'ADMIN', status: 'live' },
  { id: 'revenue', name: 'Revenue', icon: 'cash', iconSet: 'Ionicons', route: '/(admin)/command-centre/revenue', color: '#fff', bgColor: '#059669', ownerOnly: true, category: 'ADMIN', status: 'live' },

  // ─── UTILITY (3 apps) ───
  { id: 'documents', name: 'Documents', icon: 'document', iconSet: 'Ionicons', route: '/(os)/profile/documents', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'qr', name: 'QR', icon: 'qr-code', iconSet: 'Ionicons', route: '/(os)/profile/qr', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'reader', name: 'Reader', icon: 'book', iconSet: 'Ionicons', route: '/(os)/reader', color: '#fff', bgColor: '#059669', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'wifi', name: 'WiFi', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/wifi', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'UTILITY', status: 'live' },

  // ─── OTHER ───
  { id: 'property', name: 'Property', icon: 'home', iconSet: 'Ionicons', route: '/(os)/property', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'OS', status: 'live' },
  { id: 'government', name: 'Government', icon: 'business', iconSet: 'Ionicons', route: '/(os)/health/government', color: '#fff', bgColor: '#1e40af', ownerOnly: false, category: 'HEALTH', status: 'live' },
];

// Sort alphabetically by name
ALL_APPS.sort((a, b) => a.name.localeCompare(b.name));

// ─── Derived Lists ───
export const PUBLIC_APPS = ALL_APPS.filter((a) => !a.ownerOnly);
export const OWNER_APPS = ALL_APPS.filter((a) => a.ownerOnly);
export const LIVE_APPS = ALL_APPS.filter((a) => a.status === 'live');
export const MISSING_APPS = ALL_APPS.filter((a) => a.status === 'missing');
export const STUB_APPS = ALL_APPS.filter((a) => a.status === 'stub');

export const getAppsByCategory = (category: string) =>
  ALL_APPS.filter((a) => a.category === category);

export const getAppById = (id: string): AppTile | undefined =>
  ALL_APPS.find((a) => a.id === id);

export const getAppsByRoutePrefix = (prefix: string): AppTile[] =>
  ALL_APPS.filter((a) => a.route.startsWith(prefix));

export const FINANCE_APPS = getAppsByCategory('FINANCE');
export const HEALTH_APPS = getAppsByCategory('HEALTH');
export const CIVIC_APPS = getAppsByCategory('CIVIC');
export const COMMERCE_APPS = getAppsByCategory('COMMERCE');
export const OS_APPS = getAppsByCategory('OS');
export const TRANSPORT_APPS = getAppsByCategory('TRANSPORT');
export const SOCIAL_APPS = getAppsByCategory('SOCIAL');
export const MEDIA_APPS = getAppsByCategory('MEDIA');
export const WORK_APPS = getAppsByCategory('WORK');
export const EDUCATION_APPS = getAppsByCategory('EDUCATION');
export const ADMIN_APPS = getAppsByCategory('ADMIN');
export const UTILITY_APPS = getAppsByCategory('UTILITY');

export const APP_COUNT = ALL_APPS.length;
export const MISSING_COUNT = MISSING_APPS.length;
