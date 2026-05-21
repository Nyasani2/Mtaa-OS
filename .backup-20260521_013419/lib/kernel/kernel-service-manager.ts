// lib/kernel/kernel-service-manager.ts
import { supabase } from '@/lib/supabase';

export interface ServiceDefinition {
  name: string;
  type: 'singleton' | 'transient' | 'scoped';
  factory: () => any;
  dependencies?: string[];
  lazy?: boolean;
}

export interface ServiceInstance {
  name: string;
  instance: any;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export class ServiceManager {
  private static services: Map<string, ServiceDefinition> = new Map();
  private static instances: Map<string, ServiceInstance> = new Map();
  private static scopedInstances: Map<string, Map<string, ServiceInstance>> = new Map();

  static register(definition: ServiceDefinition) {
    this.services.set(definition.name, definition);
    if (!definition.lazy) {
      this.resolve(definition.name);
    }
  }

  static resolve<T = any>(name: string, scope?: string): T {
    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Check dependencies
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (!this.instances.has(dep) && !this.scopedInstances.get(scope || '')?.has(dep)) {
          this.resolve(dep, scope);
        }
      }
    }

    // Return existing instance for singletons
    if (definition.type === 'singleton') {
      const existing = this.instances.get(name);
      if (existing) {
        existing.lastUsed = new Date().toISOString();
        existing.useCount++;
        return existing.instance;
      }
    }

    // Return scoped instance
    if (definition.type === 'scoped' && scope) {
      const scopeMap = this.scopedInstances.get(scope) || new Map();
      const existing = scopeMap.get(name);
      if (existing) {
        existing.lastUsed = new Date().toISOString();
        existing.useCount++;
        return existing.instance;
      }
    }

    // Create new instance
    const instance = definition.factory();
    const serviceInstance: ServiceInstance = {
      name,
      instance,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1,
    };

    if (definition.type === 'singleton') {
      this.instances.set(name, serviceInstance);
    } else if (definition.type === 'scoped' && scope) {
      const scopeMap = this.scopedInstances.get(scope) || new Map();
      scopeMap.set(name, serviceInstance);
      this.scopedInstances.set(scope, scopeMap);
    }

    return instance;
  }

  static has(name: string): boolean {
    return this.services.has(name);
  }

  static getInstanceInfo(name: string): ServiceInstance | undefined {
    return this.instances.get(name);
  }

  static getAllServices(): string[] {
    return Array.from(this.services.keys());
  }

  static getHealth(): Record<string, { status: string; useCount: number; age_ms: number }> {
    const now = Date.now();
    const health: Record<string, any> = {};

    for (const [name, instance] of this.instances) {
      health[name] = {
        status: 'active',
        useCount: instance.useCount,
        age_ms: now - new Date(instance.createdAt).getTime(),
      };
    }

    return health;
  }

  static dispose(name: string, scope?: string) {
    if (scope) {
      this.scopedInstances.get(scope)?.delete(name);
    } else {
      const instance = this.instances.get(name);
      if (instance?.instance?.dispose) {
        instance.instance.dispose();
      }
      this.instances.delete(name);
    }
  }

  static disposeScope(scope: string) {
    const scopeMap = this.scopedInstances.get(scope);
    if (scopeMap) {
      for (const [, instance] of scopeMap) {
        if (instance.instance?.dispose) {
          instance.instance.dispose();
        }
      }
      this.scopedInstances.delete(scope);
    }
  }

  static clear() {
    for (const [, instance] of this.instances) {
      if (instance.instance?.dispose) {
        instance.instance.dispose();
      }
    }
    this.instances.clear();
    this.scopedInstances.clear();
  }
}
