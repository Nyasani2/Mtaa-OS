export type ModuleId = string;

export type ModuleCategory =
  | "finance"
  | "health"
  | "system"
  | "transport"
  | "logistics"
  | "civic"
  | "social"
  | "commerce"
  | "work"
  | "education"
  | "marketing"
  | "utility"
  | "productivity"
  | "media"
  | "communication"
  | string;

export type ModuleVisibility = "public" | "private" | "system" | "beta";

export type ModuleLifecycle =
  | "installed"
  | "enabled"
  | "disabled"
  | "suspended"
  | "updating"
  | "uninstalled";

// AppPermission accepts core permissions, module-specific patterns, OR any string
export type AppPermission =
  | "camera"
  | "microphone"
  | "contacts"
  | "storage"
  | "location"
  | "notifications"
  | "wallet"
  | "biometric"
  | `${string}:${string}`
  | string;

export interface ModuleDeveloper {
  name: string;
  id: string;
  url?: string;
  verified?: boolean;
}

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  description: string;
  version: string;
  category: ModuleCategory;
  icon: string;
  route: string;
  color: string;
  installable: boolean;
  permissions: string[];
  entry: string;
  screenshots: string[];
  developer: ModuleDeveloper;
  dependencies: ModuleId[];
  enabled: boolean;
  visibility: ModuleVisibility;
  size?: string;
  rating?: number;
  downloadCount?: number;
  releaseDate?: string;
  updateDate?: string;
  changelog?: string[];
  tags?: string[];
}

export interface InstalledModule {
  manifest: ModuleManifest;
  lifecycle: ModuleLifecycle;
  installedAt: number;
  updatedAt: number;
  installSource: "appstore" | "sideload" | "system" | "enterprise";
  installPath?: string;
  localDataSize?: number;
  lastOpenedAt?: number;
  openCount?: number;
}

export interface ModuleRegistryState {
  modules: Record<ModuleId, InstalledModule>;
  loading: boolean;
  error: string | null;
}

export interface InstallResult {
  success: boolean;
  moduleId: ModuleId;
  error?: string;
  manifest?: ModuleManifest;
}

export interface LauncherApp {
  id: ModuleId;
  name: string;
  icon: string;
  color: string;
  route: string;
  category: ModuleCategory;
  badge?: number;
  pinned?: boolean;
}

export interface AppStoreCategory {
  id: string;
  name: string;
  icon: string;
  apps: ModuleManifest[];
  featured?: boolean;
}

export interface AppStoreState {
  categories: AppStoreCategory[];
  featured: ModuleManifest[];
  trending: ModuleManifest[];
  newReleases: ModuleManifest[];
  topRated: ModuleManifest[];
  searchQuery: string;
  searchResults: ModuleManifest[];
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}
