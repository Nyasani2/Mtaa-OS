export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  domain: string;
  icon?: string;
  color?: string;
  category: string;
  permissions: string[];
  routes: string[];
  dependencies: string[];
  entry_point: string;
  enabled: boolean;
  installable: boolean;
  system_app: boolean;
  min_kernel_version?: string;
  config_schema?: Record<string, any>;
}

export interface AppInstallation {
  id: string;
  user_id: string;
  app_id: string;
  installed_at: string;
  is_enabled: boolean;
  pinned: boolean;
  grid_x?: number;
  grid_y?: number;
  screen?: number;
  folder_id?: string | null;
  badge_count: number;
  last_opened_at?: string | null;
  open_count: number;
}
