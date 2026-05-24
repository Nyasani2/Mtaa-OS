// ============================================================
// MODULE REGISTRY — Tracks ALL loaded ASIS systems
// Health checks, dependency validation, hot-reload ready
// ============================================================

import { IModuleRegistry } from './interfaces';
import { ModuleRegistration, ModuleHealth } from './types';

export class ModuleRegistry implements IModuleRegistry {
  private modules: Map<string, ModuleRegistration> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  register(module: ModuleRegistration): void {
    this.modules.set(module.id, module);
    this.dependencyGraph.set(module.id, new Set(module.dependencies));
    console.log(`[ModuleRegistry] Registered: ${module.id} (${module.domain}) v${module.version}`);
  }

  unregister(moduleId: string): void {
    const mod = this.modules.get(moduleId);
    if (mod) {
      // Check if other modules depend on this
      const dependents = this.getDependents(moduleId);
      if (dependents.length > 0) {
        console.warn(`[ModuleRegistry] ${moduleId} has dependents: ${dependents.join(', ')}`);
      }
      this.modules.delete(moduleId);
      this.dependencyGraph.delete(moduleId);
      console.log(`[ModuleRegistry] Unregistered: ${moduleId}`);
    }
  }

  get(moduleId: string): ModuleRegistration | undefined {
    return this.modules.get(moduleId);
  }

  getAll(): ModuleRegistration[] {
    return Array.from(this.modules.values());
  }

  getByDomain(domain: string): ModuleRegistration[] {
    return this.getAll().filter(m => m.domain === domain);
  }

  validateDependencies(): string[] {
    const errors: string[] = [];
    for (const [moduleId, deps] of this.dependencyGraph.entries()) {
      for (const dep of deps) {
        if (!this.modules.has(dep)) {
          errors.push(`Module ${moduleId} depends on ${dep} which is not registered`);
        }
      }
    }
    return errors;
  }

  async checkHealth(moduleId: string): Promise<ModuleHealth> {
    const mod = this.modules.get(moduleId);
    if (!mod) {
      return { status: 'unknown', lastCheck: new Date().toISOString(), uptimeMs: 0, errorCount: 0, latencyAvgMs: 0 };
    }

    // In production: perform actual health check
    const health: ModuleHealth = {
      status: mod.state === 'active' ? 'healthy' : mod.state === 'degraded' ? 'degraded' : 'unhealthy',
      lastCheck: new Date().toISOString(),
      uptimeMs: mod.health.uptimeMs + 5000,
      errorCount: mod.health.errorCount,
      latencyAvgMs: mod.health.latencyAvgMs,
    };

    // Update stored health
    mod.health = health;
    this.modules.set(moduleId, mod);

    return health;
  }

  getDependents(moduleId: string): string[] {
    const dependents: string[] = [];
    for (const [id, deps] of this.dependencyGraph.entries()) {
      if (deps.has(moduleId)) dependents.push(id);
    }
    return dependents;
  }

  getDependencyTree(moduleId: string): string[] {
    const visited = new Set<string>();
    const queue = [moduleId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const deps = this.dependencyGraph.get(current) || new Set();
      queue.push(...Array.from(deps));
    }
    return Array.from(visited);
  }
}
