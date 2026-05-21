// lib/mtaa/kernel/service-manager.ts
export interface ServiceDefinition { name: string; loader: () => Promise<unknown>; dependencies: string[]; singleton: boolean; }

class ServiceManager {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, unknown>();
  private loading = new Set<string>();

  register(def: ServiceDefinition): void { this.services.set(def.name, def); }

  async load(name: string): Promise<unknown> {
    if (this.instances.has(name)) return this.instances.get(name);
    if (this.loading.has(name)) throw new Error(`Circular dependency: ${name}`);
    const def = this.services.get(name);
    if (!def) throw new Error(`Service not registered: ${name}`);
    this.loading.add(name);
    for (const dep of def.dependencies) await this.load(dep);
    const instance = await def.loader();
    if (def.singleton) this.instances.set(name, instance);
    this.loading.delete(name);
    return instance;
  }

  isLoaded(name: string): boolean { return this.instances.has(name); }
  unload(name: string): void { this.instances.delete(name); }
  unloadAll(): void { this.instances.clear(); this.loading.clear(); }
}
export const serviceManager = new ServiceManager();
