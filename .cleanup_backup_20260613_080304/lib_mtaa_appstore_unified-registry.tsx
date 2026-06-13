export interface AppManifest {
  id: string;
  name: string;
  slug: string;
  category: string;
  version: string;
  icon: string;
  route: string;
  installed: boolean;
}

class UnifiedRegistry {
  apps: AppManifest[] = [];

  register(manifest: AppManifest) {
    this.apps.push(manifest);
  }

  getById(id: string) {
    return this.apps.find(a => a.id === id);
  }

  getInstalled() {
    return this.apps.filter(a => a.installed);
  }

  getAll() {
    return this.apps;
  }
}

export const unifiedRegistry = new UnifiedRegistry();

export function getAppById(id: string) {
  return unifiedRegistry.getById(id);
}

export default unifiedRegistry;
