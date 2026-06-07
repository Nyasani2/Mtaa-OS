// lib/mtaa/appstore/unified-registry.ts — Unified App Registry
export interface AppManifest {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  version: string;
  size_mb: number;
  is_installed: boolean;
  is_system_app: boolean;
  requires_auth: boolean;
  requires_subscription: boolean;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  developer: string;
  rating: number;
  review_count: number;
  screenshots: string[];
  permissions: string[];
  entry_route: string;
  is_native: boolean;
  status: 'active' | 'pending' | 'suspended' | 'deprecated';
  updated_at: string;
  installed_at?: string;
  section?: string;
}

const ALL_APPS: AppManifest[] = [
  // MTAA Apps
  {
    id: 'wallet', name: 'Wallet', slug: 'wallet', description: 'Send, receive, and manage money',
    icon: 'wallet', color: '#2563EB', category: 'Finance', version: '1.0.0', size_mb: 12,
    is_installed: true, is_system_app: true, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.8, review_count: 1240,
    screenshots: [], permissions: [], entry_route: '/wallet', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'health', name: 'Health', slug: 'health', description: 'Healthcare and telemedicine',
    icon: 'medical', color: '#10B981', category: 'Health', version: '1.0.0', size_mb: 18,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.5, review_count: 890,
    screenshots: [], permissions: [], entry_route: '/health', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'mtaxi', name: 'MTaxi', slug: 'mtaxi', description: 'Ride hailing and carpooling',
    icon: 'car', color: '#F59E0B', category: 'Transport', version: '1.0.0', size_mb: 22,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.6, review_count: 2100,
    screenshots: [], permissions: [], entry_route: '/mtaxi', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'mtruck', name: 'MTruck', slug: 'mtruck', description: 'Freight and logistics',
    icon: 'truck', color: '#8B5CF6', category: 'Transport', version: '1.0.0', size_mb: 25,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.4, review_count: 560,
    screenshots: [], permissions: [], entry_route: '/mtruck', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'tribes', name: 'Tribes', slug: 'tribes', description: 'Community groups and events',
    icon: 'people', color: '#EC4899', category: 'Social', version: '1.0.0', size_mb: 15,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.7, review_count: 1500,
    screenshots: [], permissions: [], entry_route: '/tribes', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'shop', name: 'Shop', slug: 'shop', description: 'Buy and sell products',
    icon: 'cart', color: '#EF4444', category: 'Commerce', version: '1.0.0', size_mb: 14,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.3, review_count: 780,
    screenshots: [], permissions: [], entry_route: '/shop', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'marketplace', name: 'Marketplace', slug: 'marketplace', description: 'Peer-to-peer marketplace',
    icon: 'storefront', color: '#06B6D4', category: 'Commerce', version: '1.0.0', size_mb: 16,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.2, review_count: 640,
    screenshots: [], permissions: [], entry_route: '/marketplace', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'streets', name: 'Streets', slug: 'streets', description: 'Social feed and local news',
    icon: 'newspaper', color: '#6366F1', category: 'Social', version: '1.0.0', size_mb: 13,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.5, review_count: 920,
    screenshots: [], permissions: [], entry_route: '/streets', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'jobs', name: 'Jobs', slug: 'jobs', description: 'Find work and hire talent',
    icon: 'briefcase', color: '#14B8A6', category: 'Work', version: '1.0.0', size_mb: 11,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.1, review_count: 430,
    screenshots: [], permissions: [], entry_route: '/jobs', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  {
    id: 'education', name: 'Education', slug: 'education', description: 'Learning and courses',
    icon: 'school', color: '#F97316', category: 'Education', version: '1.0.0', size_mb: 20,
    is_installed: false, is_system_app: false, requires_auth: true, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA', rating: 4.6, review_count: 670,
    screenshots: [], permissions: [], entry_route: '/education', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'mtaa',
  },
  // Android Apps
  {
    id: 'phone', name: 'Phone', slug: 'phone', description: 'Calls and contacts',
    icon: 'call', color: '#22C55E', category: 'Communication', version: '1.0.0', size_mb: 8,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/phone', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'messages', name: 'Messages', slug: 'messages', description: 'SMS and chat',
    icon: 'chatbubble', color: '#3B82F6', category: 'Communication', version: '1.0.0', size_mb: 9,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/messages', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'gallery', name: 'Gallery', slug: 'gallery', description: 'Photos and videos',
    icon: 'images', color: '#A855F7', category: 'Media', version: '1.0.0', size_mb: 10,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/gallery', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'camera', name: 'Camera', slug: 'camera', description: 'Take photos and videos',
    icon: 'camera', color: '#EF4444', category: 'Media', version: '1.0.0', size_mb: 7,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/camera', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'settings', name: 'Settings', slug: 'settings', description: 'System settings',
    icon: 'settings', color: '#64748B', category: 'System', version: '1.0.0', size_mb: 6,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/settings', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'clock', name: 'Clock', slug: 'clock', description: 'Alarm and timer',
    icon: 'time', color: '#F59E0B', category: 'Utility', version: '1.0.0', size_mb: 5,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/clock', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'calendar', name: 'Calendar', slug: 'calendar', description: 'Events and schedule',
    icon: 'calendar', color: '#10B981', category: 'Utility', version: '1.0.0', size_mb: 6,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/scheduler', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
  {
    id: 'calculator', name: 'Calculator', slug: 'calculator', description: 'Basic calculator',
    icon: 'calculator', color: '#374151', category: 'Utility', version: '1.0.0', size_mb: 3,
    is_installed: true, is_system_app: true, requires_auth: false, requires_subscription: false,
    subscription_tier: 'free', developer: 'MTAA OS', rating: 4.0, review_count: 100,
    screenshots: [], permissions: [], entry_route: '/calculator', is_native: true, status: 'active',
    updated_at: '2024-01-01', section: 'android',
  },
];

export function getAppsBySection(section: string): AppManifest[] {
  return ALL_APPS.filter(app => app.section === section || (section === 'all' && true));
}

export function getAppById(id: string): AppManifest | undefined {
  return ALL_APPS.find(app => app.id === id);
}

export function getAllApps(): AppManifest[] {
  return ALL_APPS;
}

export function getCategories(): string[] {
  return [...new Set(ALL_APPS.map(a => a.category))];
}

export default ALL_APPS;
