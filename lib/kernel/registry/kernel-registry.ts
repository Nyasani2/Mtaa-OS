export class KernelRegistry {
  private static instance: KernelRegistry;
  private apps = new Map<string, any>();

  static getInstance(): KernelRegistry {
    if (!KernelRegistry.instance) {
      KernelRegistry.instance = new KernelRegistry();
    }
    return KernelRegistry.instance;
  }

  get(id: string) {
    return this.apps.get(id);
  }

  getAll() {
    return Array.from(this.apps.values());
  }

  getInstallable() {
    return this.getAll().filter((app: any) => !app.isOSApp);
  }

  register(id: string, app: any) {
    this.apps.set(id, app);
  }

  async initialize() {
    // Initialize kernel systems
  }
}

export type AppRoute = string;
