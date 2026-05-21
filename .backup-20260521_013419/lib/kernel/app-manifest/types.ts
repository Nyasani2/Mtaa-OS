export interface AppPermission {
  resource: string;
  actions: string[];
  description?: string;
}

export interface AppRoute {
  title: string;
  path: string;
  component: any;
  requiresAuth?: boolean;
  requiredPermissions?: string[];
}

export interface AppManifest {
  id: string;
  name: string;
  domain: string;
  version: string;
  entryPoint: string;

  description?: string;
  icon?: string;
  color?: string;

  permissions?: AppPermission[];
  routes?: AppRoute[];

  dependencies?: string[];

  enabled?: boolean;
  installable?: boolean;
  systemApp?: boolean;

  minKernelVersion?: string;

  configSchema?: any;
}
