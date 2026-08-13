export interface AppScreen {
  name: string;
  route: string;
  icon?: string;
  requiresAuth?: boolean;
}

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  author?: string;
  permissions: string[];
  screens: AppScreen[];
  requiresAuth: boolean;
  isOSApp: boolean;
  color?: string;
  route?: string;
  developer?: string;
  shortDescription?: string;
  rating?: number;
  reviewCount?: number;
  downloadCount?: number;
  sizeMB?: number;
  tags?: string[];
  featured?: boolean;
  trending?: boolean;
  devOnly?: boolean;
  isLocalApp?: boolean;
  status?: AppStatus;
}

export type AppStatus = 'active' | 'inactive' | 'pending' | 'deprecated';

export interface InstalledApp {
  id: string;
  version: string;
  manifest: AppManifest;
  installedAt: string;
  isActive?: boolean;
}

export interface ModuleManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  author?: string;
  permissions: string[];
  entry: string;
  isOSApp: boolean;
  size?: string;
  screens?: AppScreen[];
  color?: string;
  isSystemApp?: boolean;
  isLocalApp?: boolean;
}
