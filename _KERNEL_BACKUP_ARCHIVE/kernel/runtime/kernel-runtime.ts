/**
 * MTAA OS — Unified Kernel Runtime
 * Single boot sequence. No parallel runtime loops.
 *
 * BOOT
 *  → lifecycle init
 *  → registry init
 *  → event system init
 *  → realtime init
 *  → scheduler init
 *  → app mounting
 *  → watchdog activation
 */

import { KernelEventSystem } from '../events/kernel-event-system';
import { KernelRegistry } from '../registry/kernel-registry';
import { KernelScheduler } from './kernel-scheduler';
import { KernelWatchdog } from './kernel-watchdog';
import { KernelErrorBoundary } from './kernel-error-boundary';
import { ArchitectureGuard } from '../architecture-guard';

export interface KernelRuntimeConfig {
  supabaseUrl: string;
  supabaseKey: string;
  environment: 'development' | 'staging' | 'production';
  enableWatchdog?: boolean;
  enableScheduler?: boolean;
  bootTimeoutMs?: number;
}

export type KernelRuntimePhase =
  | 'idle'
  | 'booting'
  | 'lifecycle'
  | 'registry'
  | 'events'
  | 'realtime'
  | 'scheduler'
  | 'apps'
  | 'watchdog'
  | 'ready'
  | 'degraded'
  | 'shutdown';

export interface KernelRuntimeState {
  phase: KernelRuntimePhase;
  bootedAt: number | null;
  uptimeMs: number;
  activeApps: string[];
  eventThroughput: number;
  healthScore: number; // 0-100
  errors: KernelRuntimeError[];
}

export interface KernelRuntimeError {
  phase: KernelRuntimePhase;
  module: string;
  message: string;
  timestamp: number;
  recovered: boolean;
}

let _runtime: KernelRuntime | null = null;

export class KernelRuntime {
  private config: KernelRuntimeConfig;
  private eventSystem: KernelEventSystem;
  private registry: KernelRegistry;
  private scheduler: KernelScheduler;
  private watchdog: KernelWatchdog;
  private errorBoundary: KernelErrorBoundary;
  private guard: ArchitectureGuard;

  private state: KernelRuntimeState = {
    phase: 'idle',
    bootedAt: null,
    uptimeMs: 0,
    activeApps: [],
    eventThroughput: 0,
    healthScore: 100,
    errors: [],
  };

  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: KernelRuntimeConfig) {
    this.config = {
      enableWatchdog: true,
      enableScheduler: true,
      bootTimeoutMs: 30000,
      ...config,
    };

    // Initialize all subsystems (not booted yet)
    this.eventSystem = KernelEventSystem.getInstance({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
    });

    this.registry = KernelRegistry.getInstance({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
    });

    this.scheduler = new KernelScheduler(this.eventSystem);
    this.watchdog = new KernelWatchdog(this.eventSystem);
    this.errorBoundary = new KernelErrorBoundary(this.eventSystem);
    this.guard = new ArchitectureGuard(this.eventSystem);
  }

  static getInstance(config?: KernelRuntimeConfig): KernelRuntime {
    if (!_runtime) {
      if (!config) throw new Error('KernelRuntime requires config on first init');
      _runtime = new KernelRuntime(config);
    }
    return _runtime;
  }

  static reset(): void {
    if (_runtime) {
      _runtime.shutdown();
      _runtime = null;
    }
  }

  // ─── BOOT SEQUENCE ────────────────────────────────────────

  async boot(): Promise<void> {
    if (this.state.phase !== 'idle') {
      throw new Error(`Cannot boot from phase: ${this.state.phase}`);
    }

    this.state.phase = 'booting';
    const bootStart = Date.now();

    try {
      // 1. LIFECYCLE INIT
      await this._phase('lifecycle', () => {
        this.errorBoundary.activate();
        this.guard.activate();
      });

      // 2. REGISTRY INIT
      await this._phase('registry', () => this.registry.init());

      // 3. EVENT SYSTEM INIT
      await this._phase('events', () => this.eventSystem.boot());

      // 4. REALTIME INIT
      await this._phase('realtime', () => this.registry.initRealtime());

      // 5. SCHEDULER INIT
      if (this.config.enableScheduler) {
        await this._phase('scheduler', () => this.scheduler.boot());
      }

      // 6. APP MOUNTING
      await this._phase('apps', () => this.registry.mountAllApps());

      // 7. WATCHDOG ACTIVATION
      if (this.config.enableWatchdog) {
        await this._phase('watchdog', () => this.watchdog.activate());
      }

      this.state.phase = 'ready';
      this.state.bootedAt = Date.now();

      // Start metrics collection
      this._startMetricsCollection();

      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.runtime.booted',
        payload: {
          bootTimeMs: Date.now() - bootStart,
          phase: this.state.phase,
          activeApps: this.state.activeApps,
        },
        priority: 'high',
        sourceModule: 'kernel.runtime',
      });

    } catch (err) {
      this.state.phase = 'degraded';
      this._recordError('booting', 'kernel.runtime', String(err));
      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.runtime.boot_failed',
        payload: { error: String(err), phase: this.state.phase },
        priority: 'critical',
        sourceModule: 'kernel.runtime',
      });
      throw err;
    }
  }

  // ─── SHUTDOWN ─────────────────────────────────────────────

  async shutdown(): Promise<void> {
    this.state.phase = 'shutdown';

    if (this.metricsInterval) clearInterval(this.metricsInterval);

    this.watchdog.deactivate();
    this.scheduler.shutdown();
    this.registry.unmountAllApps();
    this.eventSystem.destroy();

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.runtime.shutdown',
      payload: { uptimeMs: this.state.uptimeMs },
      priority: 'high',
      sourceModule: 'kernel.runtime',
    });
  }

  // ─── STATE ACCESS ─────────────────────────────────────────

  getState(): Readonly<KernelRuntimeState> {
    return { ...this.state, uptimeMs: this.state.bootedAt ? Date.now() - this.state.bootedAt : 0 };
  }

  getEventSystem(): KernelEventSystem {
    return this.eventSystem;
  }

  getRegistry(): KernelRegistry {
    return this.registry;
  }

  getScheduler(): KernelScheduler {
    return this.scheduler;
  }

  getWatchdog(): KernelWatchdog {
    return this.watchdog;
  }

  getErrorBoundary(): KernelErrorBoundary {
    return this.errorBoundary;
  }

  // ─── INTERNALS ──────────────────────────────────────────────

  private async _phase(phase: KernelRuntimePhase, fn: () => Promise<void> | void): Promise<void> {
    this.state.phase = phase;
    try {
      await fn();
    } catch (err) {
      this._recordError(phase, 'kernel.runtime', String(err));
      throw err;
    }
  }

  private _recordError(phase: KernelRuntimePhase, module: string, message: string): void {
    this.state.errors.push({ phase, module, message, timestamp: Date.now(), recovered: false });
    this.state.healthScore = Math.max(0, 100 - this.state.errors.length * 5);
  }

  private _startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.eventSystem.getMetrics();
      this.state.eventThroughput = metrics.delivered;
      this.state.activeApps = this.registry.getMountedApps().map((a) => a.id);

      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.runtime.heartbeat',
        payload: {
          uptimeMs: this.state.bootedAt ? Date.now() - this.state.bootedAt : 0,
          healthScore: this.state.healthScore,
          eventThroughput: this.state.eventThroughput,
          activeApps: this.state.activeApps.length,
        },
        priority: 'low',
        sourceModule: 'kernel.runtime',
      });
    }, 5000);
  }
}

export default KernelRuntime;
