// ============================================================
// MTAA OS V10 — App Catalog (Verified Against Actual File Structure)
// Routes matched to real files in app/ directory
// Last verified: 2026-07-20
// CLEANED: Removed wallet sub-features from FINANCE category
// ADDED: PUBLIC_APPS, OWNER_APPS exports for launcher compatibility
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
  // CIVIC: 'Civic Services',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  WORK: 'Work & Jobs',
  SOCIAL: 'Social',
  MEDIA: 'Media',
  ADMIN: 'Administration',
  TRANSPORT: 'Transport',
  UTILITY: 'Utility',
} as const;

// ─── Verified App List (67 apps) ───
// Routes verified against actual files in app/ directory
// Status: live = file exists, missing = no index.tsx found, stub = placeholder
export const ALL_APPS: AppTile[] = [
  // ─── OS (12 apps) ───
  { id: 'appstore', name: 'App Store', icon: 'apps', iconSet: 'Ionicons', route: '/(os)/appstore', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false,   { id: 'lock-screen', name: 'Lock Screen', icon: 'lock-closed', iconSet: 'Ionicons', route: null, action: 'lock', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'OS', status: 'live' },
category: 'OS', status: 'live' },
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

  // ─── HEALTH (13 apps) ───
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

  // ─── FINANCE (3 apps) ───
  // REMOVED from FINANCE: gofund, onboarding, savings, scan, topup, transfer, withdraw
  // These are all wallet sub-features — access them FROM the Wallet app
  { id: 'binance', name: 'Binance', icon: 'logo-bitcoin', iconSet: 'Ionicons', route: '/(finance)/binance', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'credit', name: 'Credit', icon: 'card', iconSet: 'Ionicons', route: '/(finance)/credit', color: '#fff', bgColor: '#10b981', ownerOnly: false, category: 'FINANCE', status: 'live' },
  { id: 'wallet', name: 'Wallet', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'FINANCE', status: 'live' },

  // ─── COMMERCE (5 apps) ───
  { id: 'ads', name: 'Ads', icon: 'megaphone', iconSet: 'Ionicons', route: '/(business)/ads', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'marketplace', name: 'Market', icon: 'cart', iconSet: 'Ionicons', route: '/(commerce)/marketplace', color: '#fff', bgColor: '#84cc16', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', iconSet: 'Ionicons', route: '/(os)/restaurant', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'shop', name: 'Shop', icon: 'storefront', iconSet: 'Ionicons', route: '/(commerce)/shop', color: '#fff', bgColor: '#ec4899', ownerOnly: false, category: 'COMMERCE', status: 'live' },
  { id: 'stay', name: 'Stay', icon: 'home', iconSet: 'Ionicons', route: '/(os)/stay', color: '#fff', bgColor: '#1a5c4b', ownerOnly: false, category: 'COMMERCE', status: 'live' },

  // ─── CIVIC ARCHIVED ───
  // { id: 'civic', name: 'Civic', icon: 'shield-check', iconSet: 'MaterialCommunityIcons', route: '/(civic)', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'CIVIC', status: 'missing' },
  // { id: 'courts', name: 'Courts', icon: 'scale', iconSet: 'MaterialCommunityIcons', route: '/(civic)/courts', color: '#fff', bgColor: '#7c3aed', ownerOnly: false, category: 'CIVIC', status: 'live' },
  // { id: 'immigration', name: 'Immigration', icon: 'airplane', iconSet: 'Ionicons', route: '/(civic)/immigration', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'CIVIC', status: 'live' },
  // { id: 'land', name: 'Land', icon: 'map', iconSet: 'Ionicons', route: '/(civic)/land', color: '#fff', bgColor: '#84cc16', ownerOnly: false, category: 'CIVIC', status: 'missing' },
  // { id: 'police', name: 'Police', icon: 'shield', iconSet: 'Ionicons', route: '/(civic)/police', color: '#fff', bgColor: '#1e40af', ownerOnly: false, category: 'CIVIC', status: 'live' },
  // { id: 'prisons', name: 'Prisons', icon: 'lock-closed', iconSet: 'Ionicons', route: '/(civic)/prisons', color: '#fff', bgColor: '#7c2d12', ownerOnly: false, category: 'CIVIC', status: 'live' },
  // { id: 'transport', name: 'Transport', icon: 'bus', iconSet: 'Ionicons', route: '/(civic)/transport', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'CIVIC', status: 'live' },

  // ─── TRANSPORT (4 apps) ───
  { id: 'boda', name: 'Boda', icon: 'bicycle', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#22c55e', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'garage', name: 'Garage', icon: 'car-wrench', iconSet: 'MaterialCommunityIcons', route: '/(garage)', color: '#fff', bgColor: '#6b7280', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'mtaxi', name: 'MTaxi', icon: 'car', iconSet: 'Ionicons', route: '/(mtaxi)', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'TRANSPORT', status: 'live' },
  { id: 'mtruck', name: 'MTruck', icon: 'bus', iconSet: 'Ionicons', route: '/(mtruck)', color: '#fff', bgColor: '#84cc16', ownerOnly: false, category: 'TRANSPORT', status: 'live' },

  // ─── EDUCATION (5 apps) ───
  { id: 'education', name: 'Education', icon: 'school', iconSet: 'Ionicons', route: '/(education)', color: '#fff', bgColor: '#8b5cf6', ownerOnly: false, category: 'EDUCATION', status: 'live' },
  { id: 'library', name: 'Library', icon: 'book', iconSet: 'Ionicons', route: '/(education)/library', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'EDUCATION', status: 'live' },
  { id: 'portal', name: 'Portal', icon: 'globe', iconSet: 'Ionicons', route: '/(education)/portal', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'EDUCATION', status: 'live' },
  { id: 'results', name: 'Results', icon: 'trophy', iconSet: 'Ionicons', route: '/(education)/results', color: '#fff', bgColor: '#f97316', ownerOnly: false, category: 'EDUCATION', status: 'live' },
  { id: 'timetable', name: 'Timetable', icon: 'time', iconSet: 'Ionicons', route: '/(education)/timetable', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'EDUCATION', status: 'live' },

  // ─── WORK (4 apps) ───
  { id: 'jobs', name: 'Jobs', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'WORK', status: 'live' },
  { id: 'studio', name: 'Studio', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/studio', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'WORK', status: 'live' },
  { id: 'tasks', name: 'Tasks', icon: 'checkmark-circle', iconSet: 'Ionicons', route: '/(work)/tasks', color: '#fff', bgColor: '#10b981', ownerOnly: false, category: 'WORK', status: 'live' },
  { id: 'workspace', name: 'Workspace', icon: 'desktop', iconSet: 'Ionicons', route: '/(work)/workspace', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'WORK', status: 'live' },

  // ─── SOCIAL (5 apps) ───
  { id: 'camera', name: 'Camera', icon: 'camera', iconSet: 'Ionicons', route: '/(media)/camera', color: '#fff', bgColor: '#6366f1', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'gallery', name: 'Gallery', icon: 'images', iconSet: 'Ionicons', route: '/(media)/gallery', color: '#fff', bgColor: '#ec4899', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'messages', name: 'Messages', icon: 'chatbubble', iconSet: 'Ionicons', route: '/(communication)/messages', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'streets', name: 'Streets', icon: 'newspaper', iconSet: 'Ionicons', route: '/(os)/streets', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'SOCIAL', status: 'live' },
  { id: 'tribes', name: 'Tribes', icon: 'people', iconSet: 'Ionicons', route: '/(os)/tribes', color: '#fff', bgColor: '#14b8a6', ownerOnly: false, category: 'SOCIAL', status: 'live' },

  // ─── MEDIA (3 apps) ───
  { id: 'music', name: 'Music', icon: 'musical-note', iconSet: 'Ionicons', route: '/(media)/music', color: '#fff', bgColor: '#ec4899', ownerOnly: false, category: 'MEDIA', status: 'live' },
  { id: 'podcast', name: 'Podcast', icon: 'mic', iconSet: 'Ionicons', route: '/(media)/podcast', color: '#fff', bgColor: '#f59e0b', ownerOnly: false, category: 'MEDIA', status: 'live' },
  { id: 'video', name: 'Video', icon: 'play-circle', iconSet: 'Ionicons', route: '/(media)/video', color: '#fff', bgColor: '#ef4444', ownerOnly: false, category: 'MEDIA', status: 'live' },

  // ─── ADMIN (3 apps) ───
  { id: 'admin', name: 'Admin', icon: 'shield', iconSet: 'Ionicons', route: '/(os)/admin', color: '#fff', bgColor: '#7c3aed', ownerOnly: true, category: 'ADMIN', status: 'live' },
  { id: 'analytics', name: 'Analytics', icon: 'bar-chart', iconSet: 'Ionicons', route: '/(os)/analytics', color: '#fff', bgColor: '#3b82f6', ownerOnly: true, category: 'ADMIN', status: 'live' },
  { id: 'kernel', name: 'Kernel', icon: 'hardware-chip', iconSet: 'Ionicons', route: '/(os)/kernel-audit', color: '#fff', bgColor: '#1e3a5f', ownerOnly: true, category: 'ADMIN', status: 'live' },

  // ─── UTILITY (4 apps) ───
  { id: 'reader', name: 'Reader', icon: 'book', iconSet: 'Ionicons', route: '/(os)/reader', color: '#fff', bgColor: '#8b5cf6', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'upload', name: 'Upload', icon: 'cloud-upload', iconSet: 'Ionicons', route: '/(os)/upload', color: '#fff', bgColor: '#06b6d4', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'wifi', name: 'WiFi', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/wifi', color: '#fff', bgColor: '#3b82f6', ownerOnly: false, category: 'UTILITY', status: 'live' },
  { id: 'command', name: 'Command', icon: 'terminal', iconSet: 'Ionicons', route: '/(os)/command', color: '#fff', bgColor: '#334155', ownerOnly: false, category: 'UTILITY', status: 'live' },
];

// ─── PUBLIC_APPS: All non-owner apps (used by launcher when no category selected) ───
export const PUBLIC_APPS: AppTile[] = ALL_APPS.filter(
  (app) => !app.ownerOnly && app.status === 'live'
);

// ─── OWNER_APPS: Owner-only apps ───
export const OWNER_APPS: AppTile[] = ALL_APPS.filter(
  (app) => app.ownerOnly && app.status === 'live'
);

// ─── Helper: Get apps by category ───
export function getAppsByCategory(category: string): AppTile[] {
  return ALL_APPS.filter((app) => app.category === category && app.status === 'live');
}

// ─── Helper: Get all live apps ───
export function getLiveApps(): AppTile[] {
  return ALL_APPS.filter((app) => app.status === 'live');
}
