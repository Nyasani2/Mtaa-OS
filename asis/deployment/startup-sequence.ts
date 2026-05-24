// asis/deployment/startup-sequence.ts
// Deterministic boot order for ASIS initialization

import { environmentConfig } from './environment-config';
import { packageSystem } from './asis-package';
import { systemLoader } from './system-loader';
import { moduleLinker } from './module-linker';
import { apiGateway } from './api-gateway';

export type StartupStep =
  | 'config_loaded'
  | 'integrity_validated'
  | 'kernel_initialized'
  | 'modules_registered'
  | 'event_bus_started'
  | 'cognitive_mounted'
  | 'gateway_activated'
  | 'system_ready';

interface StartupEvent {
  step: StartupStep;
  timestamp: number;
  duration: number;
  status: 'ok' | 'warn' | 'error';
  message?: string;
}

class StartupSequence {
  private events: StartupEvent[] = [];
  private listeners: Set<(event: StartupEvent) => void> = new Set();

  onStep(cb: (event: StartupEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(step: StartupStep, duration: number, status: 'ok' | 'warn' | 'error', message?: string) {
    const event: StartupEvent = { step, timestamp: Date.now(), duration, status, message };
    this.events.push(event);
    this.listeners.forEach(cb => cb(event));
  }

  async execute(pkg: any): Promise<{
    success: boolean;
    totalTime: number;
    events: StartupEvent[];
  }> {
    const start = performance.now();
    let stepStart = start;

    try {
      // 1. Load environment config
      stepStart = performance.now();
      environmentConfig.load(pkg.environment);
      this.emit('config_loaded', performance.now() - stepStart, 'ok');

      // 2. Validate package integrity
      stepStart = performance.now();
      const valid = packageSystem.validatePackage(pkg);
      if (!valid) throw new Error('Package integrity validation failed');
      this.emit('integrity_validated', performance.now() - stepStart, 'ok');

      // 3. Initialize runtime kernel (ZIP 10)
      stepStart = performance.now();
      const kernel = (globalThis as any).__ASIS_RUNTIME_KERNEL__;
      if (kernel) await kernel.boot();
      this.emit('kernel_initialized', performance.now() - stepStart, 'ok');

      // 4. Register modules
      stepStart = performance.now();
      for (const mod of pkg.modules) {
        await systemLoader.registerModule(mod);
      }
      this.emit('modules_registered', performance.now() - stepStart, 'ok');

      // 5. Start event bus
      stepStart = performance.now();
      const bus = (globalThis as any).__ASIS_EVENT_BUS__;
      if (bus) await bus.start();
      this.emit('event_bus_started', performance.now() - stepStart, 'ok');

      // 6. Mount cognitive engine
      stepStart = performance.now();
      const engine = (globalThis as any).__ASIS_COGNITIVE_ENGINE__;
      if (engine) await engine.mount();
      this.emit('cognitive_mounted', performance.now() - stepStart, 'ok');

      // 7. Activate API gateway
      stepStart = performance.now();
      await apiGateway.activate();
      this.emit('gateway_activated', performance.now() - stepStart, 'ok');

      // 8. System ready
      const totalTime = performance.now() - start;
      this.emit('system_ready', totalTime, 'ok', `ASIS v${pkg.version} ready in ${totalTime.toFixed(0)}ms`);

      return { success: true, totalTime, events: [...this.events] };

    } catch (err: any) {
      const totalTime = performance.now() - start;
      this.emit('system_ready', totalTime, 'error', err.message);
      return { success: false, totalTime, events: [...this.events] };
    }
  }

  getEvents(): StartupEvent[] {
    return [...this.events];
  }
}

export const startupSequence = new StartupSequence();
