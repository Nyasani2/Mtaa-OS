// types/module.types.ts
// MTAA OS V10 — canonical module type definitions
// Imported by: kernel-registry, appstore registry/installer, garage manifest

// ─── App Manifest ───
export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  author: string;
  permissions: string[];
  screens: AppScreen[];
  requiresAuth: boolean;
  requiresPin?: boolean;
  isOSApp?: boolean;
  isSystemApp?: boolean;
  installUrl?: string;
  minOSVersion?: string;
  sizeMB?: number;
  rating?: number;
  installCount?: number;
  featured?: boolean;
  tags?: string[];
  supportedPlatforms?: ('ios' | 'android' | 'web')[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AppScreen {
  name: string;
  route: string;
  title: string;
  icon?: string;
  requiresAuth?: boolean;
  params?: Record<string, string>;
}

// ─── Kernel Registry ───
export interface KernelRegistryEntry {
  id: string;
  moduleId: string;
  manifest: AppManifest;
  status: 'registered' | 'installed' | 'active' | 'disabled' | 'error';
  installedAt?: string;
  activatedAt?: string;
  lastError?: string;
  metadata?: Record<string, any>;
}

// ─── Installed App ───
export interface InstalledApp {
  id: string;
  manifest: AppManifest;
  installedAt: string;
  updatedAt?: string;
  version: string;
  isPinned?: boolean;
  order?: number;
  notificationsEnabled?: boolean;
}

// ─── Search Engine ───
export interface SearchQuery {
  term: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  category?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  author?: string;
  tags?: string[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  module: string;
  route?: string;
  icon?: string;
  metadata?: Record<string, any>;
  relevance: number;
  createdAt?: string;
}

export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query: SearchQuery;
  durationMs?: number;
}

export interface SearchConfig {
  module: string;
  table: string;
  fields: string[];
  weights?: Record<string, number>;
  filters?: string[];
  enabled: boolean;
}

export const SEARCH_CONFIGS: SearchConfig[] = [
  {
    module: 'streets',
    table: 'streets_posts',
    fields: ['content', 'tags'],
    weights: { content: 1.0, tags: 0.8 },
    filters: ['creator_id', 'created_at'],
    enabled: true,
  },
  {
    module: 'health',
    table: 'health_facilities',
    fields: ['name', 'address', 'services'],
    weights: { name: 1.0, address: 0.6, services: 0.4 },
    filters: ['type', 'location', 'status'],
    enabled: true,
  },
  {
    module: 'education',
    table: 'education_schools',
    fields: ['name', 'location', 'description'],
    weights: { name: 1.0, location: 0.7, description: 0.3 },
    filters: ['type', 'level', 'status'],
    enabled: true,
  },
  {
    module: 'jobs',
    table: 'jobs_listings',
    fields: ['title', 'description', 'skills_required'],
    weights: { title: 1.0, description: 0.5, skills_required: 0.8 },
    filters: ['category', 'location', 'type', 'status'],
    enabled: true,
  },
  {
    module: 'shop',
    table: 'shop_products',
    fields: ['name', 'description', 'category'],
    weights: { name: 1.0, description: 0.4, category: 0.7 },
    filters: ['shop_id', 'status', 'price'],
    enabled: true,
  },
  {
    module: 'property',
    table: 'property_listings',
    fields: ['title', 'description', 'location', 'address'],
    weights: { title: 1.0, location: 0.8, address: 0.6, description: 0.3 },
    filters: ['type', 'price', 'status', 'bedrooms'],
    enabled: true,
  },
];

// ─── Module Types ───
export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  priority: number;
  dependencies: string[];
  permissions: string[];
  routes: ModuleRoute[];
  services: string[];
}

export interface ModuleRoute {
  path: string;
  component: string;
  exact?: boolean;
  requiresAuth?: boolean;
  layout?: string;
}

export interface ModuleService {
  name: string;
  endpoint: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  requiresAuth?: boolean;
  rateLimit?: number;
}

// ─── Re-export for barrel compatibility ───
export type { AppManifest as default };
