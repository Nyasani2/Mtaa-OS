// asis/deployment/system-loader.ts
// ENTRY POINT — initializes ASIS at app startup

import { ASIS_PACKAGE } from './asis-package';
import { environmentConfig } from './environment-config';
import { moduleLinker } from './module-linker';
import { apiGateway } from './api-gateway';

export type BootMode = 'cold' | 'warm' | 'recovery';

interface BootContext {
  mode: BootMode;
  environment: 'dev' | 'staging' | 'prod';
  packageVersion: string;
}

class SystemLoader {
  private initialized = false;
  private modulesLoaded = new Set<string>();
  private bootTime = 0;

  async initialize(pkg: ASIS_PACKAGE): Promise<{
    success: boolean;
    bootTime: number;
    modulesLoaded: number;
  }> {
    const start = performance.now();
    const ctx: BootContext = {
      mode: this.determineBootMode(),
      environment: pkg.environment,
      packageVersion: pkg.version,
    };

    try {
      // 1. Load environment config
      environmentConfig.load(ctx.environment);

      // 2. Validate package integrity
      if (!this.validatePackage(pkg)) {
        throw new Error('Package integrity check failed');
      }

      // 3. Initialize runtime kernel (ZIP 10)
      await this.initRuntimeKernel();

      // 4. Register all modules
      for (const mod of pkg.modules) {
        await this.registerModule(mod);
      }

      // 5. Link cross-module dependencies
      await moduleLinker.link(pkg.modules.map(m => m.name));

      // 6. Start event bus
      await this.startEventBus();

      // 7. Mount cognitive engine
      await this.mountCognitiveEngine();

      // 8. Activate API gateway
      await apiGateway.activate();

      this.initialized = true;
      this.bootTime = performance.now() - start;

      return {
        success: true,
        bootTime: this.bootTime,
        modulesLoaded: this.modulesLoaded.size,
      };

    } catch (err: any) {
      console.error('[ASIS Boot Failed]', err);
      if (ctx.mode !== 'recovery') {
        return this.recoverBoot(pkg);
      }
      throw err;
    }
  }

  private determineBootMode(): BootMode {
    if (this.initialized) return 'warm';
    // Check for previous crash
    const lastCrash = sessionStorage.getItem('asis_last_crash');
    if (lastCrash && Date.now() - parseInt(lastCrash) < 60000) {
      return 'recovery';
    }
    return 'cold';
  }

  private validatePackage(pkg: ASIS_PACKAGE): boolean {
    return pkg.version && pkg.modules.length > 0 && Object.keys(pkg.checksums).length > 0;
  }

  private async initRuntimeKernel() {
    // Delegates to ZIP 10 runtime engine
    const kernel = (globalThis as any).__ASIS_RUNTIME_KERNEL__;
    if (kernel) {
      await kernel.boot();
    }
  }

  async registerModule(mod: { name: string; entryPoint: string }) {
    // Load module via dynamic import
    try {
      const module = await import(/* webpackIgnore: true */ mod.entryPoint);
      if (module.default && typeof module.default.init === 'function') {
        await module.default.init();
      }
      this.modulesLoaded.add(mod.name);
    } catch (err) {
      console.warn(`[ASIS] Module ${mod.name} load warning:`, err);
      // Non-critical modules may fail gracefully
      if (['memory-core', 'runtime-kernel'].includes(mod.name)) {
        throw err;
      }
    }
  }

  async isModuleLoaded(name: string): Promise<boolean> {
    return this.modulesLoaded.has(name);
  }

  private async startEventBus() {
    const bus = (globalThis as any).__ASIS_EVENT_BUS__;
    if (bus && typeof bus.start === 'function') {
      await bus.start();
    }
  }

  private async mountCognitiveEngine() {
    const engine = (globalThis as any).__ASIS_COGNITIVE_ENGINE__;
    if (engine && typeof engine.mount === 'function') {
      await engine.mount();
    }
  }

  async recoverBoot(pkg: ASIS_PACKAGE): Promise<any> {
    sessionStorage.setItem('asis_last_crash', String(Date.now()));
    // Attempt minimal boot with core modules only
    const corePkg = { ...pkg, modules: pkg.modules.filter(m =>
      ['memory-core', 'runtime-kernel'].includes(m.name)
    )};
    return this.initialize(corePkg);
  }

  async restore(backup: any): Promise<void> {
    this.modulesLoaded.clear();
    this.initialized = false;
    // Would restore from backup snapshot
  }

  getStatus() {
    return {
      initialized: this.initialized,
      modulesLoaded: Array.from(this.modulesLoaded),
      bootTime: this.bootTime,
    };
  }
}

export const systemLoader = new SystemLoader();
