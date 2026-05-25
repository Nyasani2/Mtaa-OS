// types/module.types.ts — Unified AppManifest + Kernel + Search (single source of truth)

// ============================================================================
// APP PERMISSIONS
// ============================================================================
export type AppPermission =
  | "storage:read" | "storage:write"
  | "payments:read" | "payments:write"
  | "location:read" | "location:background"
  | "contacts:read" | "contacts:write"
  | "messaging:send" | "messaging:read"
  | "camera:read" | "microphone:read"
  | "phone:read" | "phone:write"
  | "health:read" | "health:write"
  | "wallet:read" | "wallet:write"
  | "notifications:send" | "notifications:read"
  | "analytics:read" | "analytics:admin"
  | "ads:read" | "ads:write" | "ads:admin" | "ads:campaign"
  | "binance:read" | "binance:write" | "binance:trade"
  | "civic:read" | "civic:write" | "civic:admin"
  | "clock:read" | "clock:write"
  | "courts:read" | "courts:write" | "courts:admin"
  | "credit:read" | "credit:write" | "credit:admin" | "credit:approve"
  | "documents:read" | "documents:write" | "documents:admin"
  | "education:read" | "education:write" | "education:admin" | "education:instruct"
  | "gallery:read" | "gallery:write" | "gallery:admin"
  | "hookup:read" | "hookup:write" | "hookup:admin"
  | "jobs:read" | "jobs:write" | "jobs:admin" | "jobs:recruit"
  | "marketplace:read" | "marketplace:write" | "marketplace:admin"
  | "messages:read" | "messages:write" | "messages:admin"
  | "mtaxi:read" | "mtaxi:write" | "mtaxi:admin" | "mtaxi:drive"
  | "mtruck:read" | "mtruck:write" | "mtruck:admin" | "mtruck:dispatch"
  | "police:read" | "police:write" | "police:admin"
  | "prisons:read" | "prisons:write" | "prisons:admin"
  | "recents:read" | "recents:write"
  | "revenue:read" | "revenue:write" | "revenue:admin" | "revenue:file"
  | "scheduler:read" | "scheduler:write" | "scheduler:admin"
  | "settings:read" | "settings:write" | "settings:admin"
  | "streets:read" | "streets:write" | "streets:admin"
  | "tribes:read" | "tribes:write" | "tribes:admin"
  | "shop:read" | "shop:write" | "shop:admin"
  // Shop-specific permissions (legacy compatibility)
  | "read:products" | "write:products" | "read:orders" | "write:orders"
  | "read:inventory" | "write:inventory"
  | "location" | "camera" | "storage" | "notifications"
  | "contacts" | "phone" | "sms" | "microphone" | "files";

// ============================================================================
// APP MANIFEST
// ============================================================================
export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  color?: string;
  author?: string;
  osLevel?: boolean;
  permissions: AppPermission[];
  entry: string;
  isOSApp: boolean;
  size: string;
  // Kernel registry compatibility fields
  isSystemApp?: boolean;
  isLocalApp?: boolean;
}

export interface InstalledApp {
  manifest: AppManifest;
  installDate: string;
  isActive: boolean;
}

export interface ModuleManifest extends AppManifest {
  color: string;
  apps?: ModuleManifest[];
}

// ============================================================================
// KERNEL REGISTRY
// ============================================================================
export interface KernelRegistryEntry {
  id: string;
  manifest: AppManifest;
  status: 'active' | 'inactive' | 'error';
  lastBooted?: string;
  errorCount: number;
}

// ============================================================================
// SEARCH ENGINE
// ============================================================================
export interface SearchQuery {
  q: string;
  domain?: string;
  filters?: Record<string, string>;
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  score: number;
  data?: Record<string, unknown>;
}

export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  query: SearchQuery;
  duration: number;
}

export interface SearchConfig {
  id: string;
  name: string;
  table: string;
  columns: string[];
  weights: Record<string, number>;
  filters?: string[];
}

export const SEARCH_CONFIGS: SearchConfig[] = [
  { id: 'profiles', name: 'People', table: 'profiles', columns: ['full_name', 'email', 'phone'], weights: { full_name: 1.0, email: 0.5, phone: 0.3 } },
  { id: 'jobs', name: 'Jobs', table: 'jobs', columns: ['title', 'description', 'company'], weights: { title: 1.0, description: 0.6, company: 0.4 } },
  { id: 'marketplace', name: 'Marketplace', table: 'marketplace_listings', columns: ['title', 'description', 'category'], weights: { title: 1.0, description: 0.5, category: 0.3 } },
  { id: 'shop', name: 'Shop', table: 'products', columns: ['name', 'description'], weights: { name: 1.0, description: 0.5 } },
  { id: 'tribes', name: 'Tribes', table: 'tribes', columns: ['name', 'description'], weights: { name: 1.0, description: 0.5 } },
  { id: 'education', name: 'Education', table: 'courses', columns: ['title', 'description'], weights: { title: 1.0, description: 0.5 } },
  { id: 'health', name: 'Health', table: 'health_patients', columns: ['name', 'id_number'], weights: { name: 1.0, id_number: 0.3 } },
  { id: 'mtaxi', name: 'MTaxi', table: 'mtaxi_rides', columns: ['pickup', 'dropoff'], weights: { pickup: 1.0, dropoff: 0.8 } },
  { id: 'mtruck', name: 'MTruck', table: 'mtruck_jobs', columns: ['origin', 'destination'], weights: { origin: 1.0, destination: 0.8 } },
  { id: 'appstore', name: 'Apps', table: 'app_store_apps', columns: ['name', 'description'], weights: { name: 1.0, description: 0.5 } },
  { id: 'messages', name: 'Messages', table: 'messages', columns: ['content'], weights: { content: 1.0 } },
  { id: 'civic_projects', name: 'Civic Projects', table: 'civic_projects', columns: ['title', 'description'], weights: { title: 1.0, description: 0.5 } },
];
