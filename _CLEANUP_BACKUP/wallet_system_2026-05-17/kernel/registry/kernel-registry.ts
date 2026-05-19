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

export interface MountedApp {
  manifest: AppManifest;
  mounted: boolean;
}

class KernelRegistryClass {
  private static instance: typeof KernelRegistryClass | null = null;
  private apps = new Map<string, MountedApp>();

  static getInstance() {
    if (!this.instance) {
      this.instance = KernelRegistryClass.getInstance();
    }
    return this.instance;
  }

  register(manifest: AppManifest) {
    this.apps.set(manifest.id, {
      manifest,
      mounted: true,
    });
  }

  get(id: string) {
    return this.apps.get(id);
  }

  all() {
    return [...this.apps.values()];
  }
}

export const KernelRegistry = KernelRegistryClass;
