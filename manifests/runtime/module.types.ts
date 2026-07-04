export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category?: string;
  permissions?: string[];
  routes?: Array<{
    path: string;
    component: string;
    title?: string;
  }>;
  screens?: Array<{
    name: string;
    route: string;
    component: string;
  }>;
  services?: string[];
  hooks?: string[];
  dependencies?: string[];
  enabled?: boolean;
  config?: Record<string, any>;
}
