export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: 'system' | 'civic' | 'commerce' | 'social' | 'utility' | 'finance' | 'health' | 'education' | 'transport';
  author: string;
  entryPoint: string;
  routes: string[];
  permissions: string[];
  config?: Record<string, any>;
  isCore?: boolean;
  isInstalled?: boolean;
  installDate?: string;
  size?: string;
  rating?: number;
  downloads?: number;
}

export interface AppRegistry {
  apps: AppManifest[];
  categories: string[];
  version: string;
}

export type AppCategory = AppManifest['category'];
