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

export const unifiedRegistry = {
  apps: [] as AppManifest[],
  register(manifest: AppManifest) {
    this.apps.push(manifest);
  },
  getById(id: string) {
    return this.apps.find(a => a.id === id);
  },
  getAppById(id: string) {
    return this.apps.find(a => a.id === id);
  },
  getInstalled() {
    return this.apps.filter(a => a.installed);
  },
  getAll() {
    return this.apps;
  },
};

export const getAppById = unifiedRegistry.getAppById.bind(unifiedRegistry);

export default unifiedRegistry;
