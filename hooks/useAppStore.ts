// hooks/useAppStore.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────

export interface AppManifest {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
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
  // Aliases for UI compatibility
  size?: string;
  route?: string;
  isSystem?: boolean;
}

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AppInterest {
  id: string;
  label: string;
  selected: boolean;
}

export interface AppStoreState {
  apps: AppManifest[];
  installedApps: string[];
  installingApps: string[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedApp: AppManifest | null;
  isInstallingAny: boolean;
  installProgress: number;
  categories: AppCategory[];
  interests: AppInterest[];
  hasCompletedOnboarding: boolean;

  // Actions
  loadApps: () => Promise<void>;
  loadInstalledApps: () => Promise<void>;
  installApp: (appId: string) => Promise<boolean>;
  uninstallApp: (appId: string) => Promise<boolean>;
  launchApp: (appId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedApp: (app: AppManifest | null) => void;
  getFilteredApps: () => AppManifest[];
  getInstalledAppData: () => AppManifest[];
  getFeaturedApps: () => AppManifest[];
  getCategories: () => string[];
  // UI-compatibility methods
  getSponsoredApps: () => AppManifest[];
  getRecommendedApps: () => AppManifest[];
  getTopCharts: () => AppManifest[];
  isInstalled: (appId: string) => boolean;
  isInstalling: (appId: string) => boolean;
  toggleInterest: (interestId: string) => void;
  completeOnboarding: () => void;
}

// ─── Default Categories ─────────────────────────────────────────────

const DEFAULT_CATEGORIES: AppCategory[] = [
  { id: 'transport', name: 'Transport', icon: 'truck', color: '#4ECDC4' },
  { id: 'social', name: 'Social', icon: 'users', color: '#FF6B6B' },
  { id: 'commerce', name: 'Commerce', icon: 'shopping-bag', color: '#FFD700' },
  { id: 'work', name: 'Work', icon: 'briefcase', color: '#85C1E9' },
  { id: 'navigation', name: 'Navigation', icon: 'map', color: '#96CEB4' },
  { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#DDA0DD' },
  { id: 'government', name: 'Government', icon: 'landmark', color: '#F4A460' },
  { id: 'finance', name: 'Finance', icon: 'wallet', color: '#3b82f6' },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#ef4444' },
  { id: 'system', name: 'System', icon: 'settings', color: '#888' },
  { id: 'communication', name: 'Communication', icon: 'message-circle', color: '#22c55e' },
];

// ─── Default Interests ──────────────────────────────────────────────

const DEFAULT_INTERESTS: AppInterest[] = [
  { id: 'transport', label: 'Transport', selected: false },
  { id: 'social', label: 'Social', selected: false },
  { id: 'shopping', label: 'Shopping', selected: false },
  { id: 'finance', label: 'Finance', selected: false },
  { id: 'health', label: 'Health', selected: false },
  { id: 'education', label: 'Education', selected: false },
  { id: 'government', label: 'Government', selected: false },
  { id: 'work', label: 'Work', selected: false },
];

// ─── Default App Registry ────────────────────────────────────────────

const DEFAULT_APPS: AppManifest[] = [
  {
    id: 'mtaxi', name: 'MTaxi', slug: 'mtaxi',
    description: 'Ride-hailing and transportation services',
    icon: 'car', category: 'Transport', version: '2.1.0', size_mb: 45,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.7, review_count: 1240,
    screenshots: [], permissions: ['location', 'camera', 'notifications'],
    entry_route: '/(os)/mtaxi', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '45 MB', route: '/(os)/mtaxi',
  },
  {
    id: 'mtruck', name: 'MTruck', slug: 'mtruck',
    description: 'Freight and logistics management',
    icon: 'truck', category: 'Transport', version: '1.8.0', size_mb: 52,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.5, review_count: 890,
    screenshots: [], permissions: ['location', 'camera', 'notifications', 'storage'],
    entry_route: '/(os)/mtruck', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '52 MB', route: '/(os)/mtruck',
  },
  {
    id: 'tribes', name: 'Tribes', slug: 'tribes',
    description: 'Community and social networking',
    icon: 'users', category: 'Social', version: '3.0.0', size_mb: 38,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.6, review_count: 2100,
    screenshots: [], permissions: ['camera', 'microphone', 'notifications', 'contacts'],
    entry_route: '/(os)/tribes', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '38 MB', route: '/(os)/tribes',
  },
  {
    id: 'shop', name: 'Shop', slug: 'shop',
    description: 'E-commerce and retail marketplace',
    icon: 'shopping-bag', category: 'Commerce', version: '2.3.0', size_mb: 42,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.4, review_count: 3400,
    screenshots: [], permissions: ['camera', 'notifications', 'storage'],
    entry_route: '/(os)/shop', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '42 MB', route: '/(os)/shop',
  },
  {
    id: 'marketplace', name: 'Marketplace', slug: 'marketplace',
    description: 'Peer-to-peer buying and selling',
    icon: 'store', category: 'Commerce', version: '1.9.0', size_mb: 35,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.3, review_count: 1800,
    screenshots: [], permissions: ['camera', 'notifications', 'storage'],
    entry_route: '/(os)/marketplace', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '35 MB', route: '/(os)/marketplace',
  },
  {
    id: 'jobs', name: 'Jobs', slug: 'jobs',
    description: 'Employment and workforce services',
    icon: 'briefcase', category: 'Work', version: '1.5.0', size_mb: 28,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.2, review_count: 950,
    screenshots: [], permissions: ['notifications', 'storage'],
    entry_route: '/(os)/jobs', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '28 MB', route: '/(os)/jobs',
  },
  {
    id: 'streets', name: 'Streets', slug: 'streets',
    description: 'Navigation and city mapping',
    icon: 'map', category: 'Navigation', version: '2.0.0', size_mb: 65,
    is_installed: false, is_system_app: false, requires_auth: false,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.5, review_count: 1500,
    screenshots: [], permissions: ['location', 'notifications'],
    entry_route: '/(os)/streets', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '65 MB', route: '/(os)/streets',
  },
  {
    id: 'education', name: 'Education', slug: 'education',
    description: 'Learning and training platform',
    icon: 'graduation-cap', category: 'Education', version: '1.7.0', size_mb: 55,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.6, review_count: 780,
    screenshots: [], permissions: ['camera', 'microphone', 'notifications', 'storage'],
    entry_route: '/(os)/education', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '55 MB', route: '/(os)/education',
  },
  {
    id: 'civic', name: 'Civic', slug: 'civic',
    description: 'Government and public services',
    icon: 'landmark', category: 'Government', version: '1.2.0', size_mb: 40,
    is_installed: false, is_system_app: false, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.1, review_count: 420,
    screenshots: [], permissions: ['camera', 'notifications', 'storage'],
    entry_route: '/(os)/civic', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), size: '40 MB', route: '/(os)/civic',
  },
];

// ─── System Apps (always available) ──────────────────────────────────

const SYSTEM_APPS: AppManifest[] = [
  {
    id: 'wallet', name: 'Wallet', slug: 'wallet',
    description: 'Digital payments and transactions',
    icon: 'wallet', category: 'Finance', version: '3.0.0', size_mb: 0,
    is_installed: true, is_system_app: true, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.8, review_count: 5000,
    screenshots: [], permissions: ['biometric', 'notifications'],
    entry_route: '/(os)/wallet', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), installed_at: new Date().toISOString(),
    size: '0 MB', route: '/(os)/wallet', isSystem: true,
  },
  {
    id: 'health', name: 'Health', slug: 'health',
    description: 'Health records and services',
    icon: 'heart-pulse', category: 'Health', version: '2.0.0', size_mb: 0,
    is_installed: true, is_system_app: true, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.5, review_count: 1200,
    screenshots: [], permissions: ['camera', 'notifications', 'biometric'],
    entry_route: '/(os)/health', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), installed_at: new Date().toISOString(),
    size: '0 MB', route: '/(os)/health', isSystem: true,
  },
  {
    id: 'settings', name: 'Settings', slug: 'settings',
    description: 'System preferences and configuration',
    icon: 'settings', category: 'System', version: '1.0.0', size_mb: 0,
    is_installed: true, is_system_app: true, requires_auth: false,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.9, review_count: 8000,
    screenshots: [], permissions: [],
    entry_route: '/(os)/settings', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), installed_at: new Date().toISOString(),
    size: '0 MB', route: '/(os)/settings', isSystem: true,
  },
  {
    id: 'messages', name: 'Messages', slug: 'messages',
    description: 'Secure messaging and communications',
    icon: 'message-circle', category: 'Communication', version: '2.0.0', size_mb: 0,
    is_installed: true, is_system_app: true, requires_auth: true,
    requires_subscription: false, subscription_tier: 'free',
    developer: 'MTAA', rating: 4.6, review_count: 3200,
    screenshots: [], permissions: ['notifications', 'contacts', 'camera', 'microphone'],
    entry_route: '/(os)/messages', is_native: true, status: 'active',
    updated_at: new Date().toISOString(), installed_at: new Date().toISOString(),
    size: '0 MB', route: '/(os)/messages', isSystem: true,
  },
];

// ─── Store Implementation ────────────────────────────────────────────

export const useAppStore = create<AppStoreState>((set, get) => ({
  apps: [...SYSTEM_APPS, ...DEFAULT_APPS],
  installedApps: SYSTEM_APPS.map(a => a.id),
  installingApps: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'All',
  selectedApp: null,
  isInstallingAny: false,
  installProgress: 0,
  categories: DEFAULT_CATEGORIES,
  interests: DEFAULT_INTERESTS,
  hasCompletedOnboarding: true, // Default to true; set false if you want onboarding

  loadApps: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('app_store_apps')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const dbApps: AppManifest[] = data.map((app: any) => ({
          id: app.id, name: app.name, slug: app.slug,
          description: app.description, icon: app.icon,
          category: app.category, version: app.version,
          size_mb: app.size_mb, is_installed: get().installedApps.includes(app.id),
          is_system_app: app.is_system_app, requires_auth: app.requires_auth,
          requires_subscription: app.requires_subscription,
          subscription_tier: app.subscription_tier, developer: app.developer,
          rating: app.rating, review_count: app.review_count,
          screenshots: app.screenshots || [], permissions: app.permissions || [],
          entry_route: app.entry_route, is_native: app.is_native,
          status: app.status, updated_at: app.updated_at,
          size: `${app.size_mb} MB`, route: app.entry_route,
          isSystem: app.is_system_app,
        }));

        const systemIds = SYSTEM_APPS.map(a => a.id);
        const merged = [...SYSTEM_APPS, ...dbApps.filter(a => !systemIds.includes(a.id))];
        set({ apps: merged });
      }
    } catch (err: any) {
      console.warn('AppStore: Using default registry (DB unavailable)', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  loadInstalledApps: async () => {
    const { user } = useIdentity.getState();
    if (!user) {
      set({ installedApps: SYSTEM_APPS.map(a => a.id) });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_installed_apps')
        .select('app_id, installed_at')
        .eq('user_id', user.id);
      if (error) throw error;
      const installed = data?.map((r: any) => r.app_id) || [];
      const allInstalled = [...new Set([...SYSTEM_APPS.map(a => a.id), ...installed])];
      set((state) => ({
        installedApps: allInstalled,
        apps: state.apps.map(app => ({
          ...app,
          is_installed: allInstalled.includes(app.id),
          installed_at: data?.find((r: any) => r.app_id === app.id)?.installed_at,
        })),
      }));
    } catch (err) {
      console.warn('AppStore: Could not load installed apps', err);
      set({ installedApps: SYSTEM_APPS.map(a => a.id) });
    }
  },

  installApp: async (appId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated) {
      set({ error: 'Please sign in to install apps' });
      return false;
    }
    const app = get().apps.find(a => a.id === appId);
    if (!app) return false;
    if (app.is_system_app) return true;

    set({ isInstallingAny: true, installProgress: 0, error: null });
    set((state) => ({ installingApps: [...state.installingApps, appId] }));

    const progressInterval = setInterval(() => {
      set((state) => ({ installProgress: Math.min(state.installProgress + Math.random() * 25, 90) }));
    }, 300);

    try {
      const { error } = await supabase
        .from('user_installed_apps')
        .upsert({
          user_id: user!.id, app_id: appId,
          installed_at: new Date().toISOString(), version: app.version,
        }, { onConflict: 'user_id,app_id' });
      if (error) throw error;

      clearInterval(progressInterval);
      set({ installProgress: 100 });
      set((state) => ({
        installedApps: [...state.installedApps, appId],
        installingApps: state.installingApps.filter(id => id !== appId),
        apps: state.apps.map(a =>
          a.id === appId ? { ...a, is_installed: true, installed_at: new Date().toISOString() } : a
        ),
        isInstallingAny: false, installProgress: 0,
      }));
      return true;
    } catch (err: any) {
      clearInterval(progressInterval);
      set((state) => ({
        isInstallingAny: false, installProgress: 0,
        installingApps: state.installingApps.filter(id => id !== appId),
      }));
      return false;
    }
  },

  uninstallApp: async (appId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated) return false;
    const app = get().apps.find(a => a.id === appId);
    if (!app || app.is_system_app) return false;
    try {
      const { error } = await supabase
        .from('user_installed_apps')
        .delete()
        .eq('user_id', user!.id)
        .eq('app_id', appId);
      if (error) throw error;
      set((state) => ({
        installedApps: state.installedApps.filter(id => id !== appId),
        apps: state.apps.map(a =>
          a.id === appId ? { ...a, is_installed: false, installed_at: undefined } : a
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  launchApp: async (appId: string) => {
    const app = get().apps.find(a => a.id === appId);
    if (!app) { set({ error: `App ${appId} not found` }); return; }
    if (!app.is_installed) {
      const installed = await get().installApp(appId);
      if (!installed) return;
    }
    console.log(`[AppStore] Launching ${app.name} -> ${app.entry_route}`);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setSelectedApp: (app: AppManifest | null) => set({ selectedApp: app }),

  getFilteredApps: () => {
    const { apps, searchQuery, selectedCategory } = get();
    return apps.filter(app => {
      const matchesSearch = !searchQuery ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  },

  getInstalledAppData: () => {
    const { apps, installedApps } = get();
    return apps.filter(app => installedApps.includes(app.id));
  },

  getFeaturedApps: () => {
    const { apps } = get();
    return apps
      .filter(app => !app.is_system_app && app.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  },

  getCategories: () => {
    const { apps } = get();
    const categories = new Set(apps.map(app => app.category));
    return ['All', ...Array.from(categories).sort()];
  },

  // ─── UI-compatibility methods ─────────────────────────────────────

  getSponsoredApps: () => {
    const { apps } = get();
    return apps
      .filter(app => !app.is_system_app && app.rating >= 4.6)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  },

  getRecommendedApps: () => {
    const { apps } = get();
    return apps
      .filter(app => !app.is_system_app && app.rating >= 4.3)
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, 8);
  },

  getTopCharts: () => {
    const { apps } = get();
    return apps
      .filter(app => !app.is_system_app)
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, 10);
  },

  isInstalled: (appId: string) => get().installedApps.includes(appId),

  isInstalling: (appId: string) => get().installingApps.includes(appId),

  toggleInterest: (interestId: string) => {
    set((state) => ({
      interests: state.interests.map(i =>
        i.id === interestId ? { ...i, selected: !i.selected } : i
      ),
    }));
  },

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
}));

export default useAppStore;

