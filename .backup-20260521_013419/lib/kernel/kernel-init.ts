// lib/kernel/kernel-init.ts
import { supabase } from '@/lib/supabase';

export interface KernelModule {
  name: string;
  version: string;
  status: 'loading' | 'ready' | 'error' | 'disabled';
  dependencies: string[];
  init: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
}

export interface KernelState {
  bootPhase: 'idle' | 'initializing' | 'loading_modules' | 'ready' | 'error' | 'safe_mode';
  modules: Map<string, KernelModule>;
  errors: string[];
  startTime: number;
  lastHealthCheck: number;
}

class KernelInitializer {
  private state: KernelState = {
    bootPhase: 'idle',
    modules: new Map(),
    errors: [],
    startTime: 0,
    lastHealthCheck: 0,
  };

  private listeners: Set<(state: KernelState) => void> = new Set();

  registerModule(module: KernelModule) {
    this.state.modules.set(module.name, { ...module, status: 'loading' });
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.state, modules: new Map(this.state.modules) }));
  }

  subscribe(callback: (state: KernelState) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async boot() {
    this.state.bootPhase = 'initializing';
    this.state.startTime = Date.now();
    this.notify();

    try {
      // Phase 1: Check Supabase connection
      const { error: connError } = await supabase.from('kernel_health_snapshots').select('id').limit(1);
      if (connError && connError.code !== 'PGRST116') {
        throw new Error(`Supabase connection failed: ${connError.message}`);
      }

      this.state.bootPhase = 'loading_modules';
      this.notify();

      // Phase 2: Initialize modules in dependency order
      const initialized = new Set<string>();
      const modules = Array.from(this.state.modules.values());

      for (let attempt = 0; attempt < 3; attempt++) {
        for (const module of modules) {
          if (initialized.has(module.name)) continue;
          const depsReady = module.dependencies.every(dep => initialized.has(dep));
          if (!depsReady) continue;

          try {
            await module.init();
            const healthy = await module.healthCheck();
            if (healthy) {
              initialized.add(module.name);
              this.state.modules.set(module.name, { ...module, status: 'ready' });
            } else {
              this.state.modules.set(module.name, { ...module, status: 'error' });
              this.state.errors.push(`${module.name}: health check failed`);
            }
          } catch (err: any) {
            this.state.modules.set(module.name, { ...module, status: 'error' });
            this.state.errors.push(`${module.name}: ${err.message}`);
          }
          this.notify();
        }
        if (initialized.size === modules.length) break;
      }

      // Check for unresolved modules
      const failed = modules.filter(m => !initialized.has(m.name));
      if (failed.length > 0 && failed.length < modules.length) {
        // Partial boot - continue in degraded mode
        console.warn('Partial kernel boot:', failed.map(m => m.name));
      }

      this.state.bootPhase = failed.length === modules.length ? 'error' : failed.length > 0 ? 'safe_mode' : 'ready';
      this.state.lastHealthCheck = Date.now();
      this.notify();

      // Log boot event
      await supabase.from('kernel_events').insert({
        event_type: 'boot',
        event_data: {
          phase: this.state.bootPhase,
          modules_ready: Array.from(initialized),
          modules_failed: failed.map(m => m.name),
          duration_ms: Date.now() - this.state.startTime,
          errors: this.state.errors,
        },
        severity: this.state.bootPhase === 'ready' ? 'info' : this.state.bootPhase === 'safe_mode' ? 'warning' : 'error',
      });

    } catch (err: any) {
      this.state.bootPhase = 'error';
      this.state.errors.push(`Kernel boot failed: ${err.message}`);
      this.notify();

      await supabase.from('kernel_events').insert({
        event_type: 'boot_failure',
        event_data: { error: err.message, stack: err.stack },
        severity: 'critical',
      });

      throw err;
    }
  }

  async healthCheck() {
    const results = await Promise.all(
      Array.from(this.state.modules.values())
        .filter(m => m.status === 'ready')
        .map(async m => ({ name: m.name, healthy: await m.healthCheck() }))
    );

    const failed = results.filter(r => !r.healthy);
    if (failed.length > 0) {
      this.state.errors.push(`Health check failed: ${failed.map(f => f.name).join(', ')}`);
      this.state.bootPhase = 'safe_mode';
      this.notify();
    }

    this.state.lastHealthCheck = Date.now();
    return failed.length === 0;
  }

  getState(): Readonly<KernelState> {
    return { ...this.state, modules: new Map(this.state.modules) };
  }

  isReady(): boolean {
    return this.state.bootPhase === 'ready' || this.state.bootPhase === 'safe_mode';
  }

  enterSafeMode() {
    this.state.bootPhase = 'safe_mode';
    this.notify();
  }
}

export const kernel = new KernelInitializer();
