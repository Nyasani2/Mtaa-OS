/**
 * ASIS AI — Adaptive System Intelligence System
 * Root module and public API surface
 * 
 * MTAA OS-wide intelligence layer
 * Modular | Scalable | African-first | Fintech-safe
 */

import { ASISConfig } from './core/config';
import { ASISEventBus } from './core/event-bus';
import { ASISContextEngine } from './core/context-engine';
import { ASISOrchestrator } from './core/orchestrator';
import { ASISSecurityLayer } from './security/security-layer';
import { ASISHealthMonitor } from './core/health-monitor';

export interface ASISInitOptions {
  config: ASISConfig;
  eventBus?: ASISEventBus;
  securityLayer?: ASISSecurityLayer;
}

export interface ASISStatus {
  initialized: boolean;
  modules: Record<string, boolean>;
  health: 'healthy' | 'degraded' | 'critical';
  lastHeartbeat: number;
}

export class ASIS {
  private static instance: ASIS | null = null;

  public readonly config: ASISConfig;
  public readonly eventBus: ASISEventBus;
  public readonly context: ASISContextEngine;
  public readonly orchestrator: ASISOrchestrator;
  public readonly security: ASISSecurityLayer;
  public readonly health: ASISHealthMonitor;

  private _status: ASISStatus = {
    initialized: false,
    modules: {},
    health: 'healthy',
    lastHeartbeat: 0,
  };

  private _modules: Map<string, any> = new Map();
  private _initTime: number = 0;

  private constructor(options: ASISInitOptions) {
    this.config = options.config;
    this.eventBus = options.eventBus || new ASISEventBus();
    this.security = options.securityLayer || new ASISSecurityLayer(this.config.security);
    this.context = new ASISContextEngine(this.eventBus, this.security);
    this.orchestrator = new ASISOrchestrator(this.eventBus, this.context, this.security);
    this.health = new ASISHealthMonitor(this.eventBus);

    this._initTime = Date.now();
    this._setupSystemListeners();
  }

  static getInstance(options?: ASISInitOptions): ASIS {
    if (!ASIS.instance && options) {
      ASIS.instance = new ASIS(options);
    }
    if (!ASIS.instance) {
      throw new Error('ASIS not initialized. Call ASIS.initialize() first.');
    }
    return ASIS.instance;
  }

  static async initialize(options: ASISInitOptions): Promise<ASIS> {
    if (ASIS.instance) {
      console.warn('[ASIS] Already initialized. Returning existing instance.');
      return ASIS.instance;
    }

    const asis = new ASIS(options);
    await asis._bootSequence();
    ASIS.instance = asis;
    return asis;
  }

  private async _bootSequence(): Promise<void> {
    console.log('[ASIS] Boot sequence initiated...');

    await this.security.initialize();
    this._status.modules['security'] = true;
    console.log('[ASIS] ✓ Security layer active');

    await this.eventBus.initialize();
    this._status.modules['eventBus'] = true;
    console.log('[ASIS] ✓ Event bus online');

    await this.context.initialize();
    this._status.modules['context'] = true;
    console.log('[ASIS] ✓ Context engine ready');

    await this.orchestrator.initialize();
    this._status.modules['orchestrator'] = true;
    console.log('[ASIS] ✓ Orchestrator active');

    await this.health.initialize();
    this._status.modules['health'] = true;
    console.log('[ASIS] ✓ Health monitor running');

    this._status.initialized = true;
    this._status.lastHeartbeat = Date.now();

    this.eventBus.emit('asis:boot:complete', {
      initTime: Date.now() - this._initTime,
      modules: Object.keys(this._status.modules),
    });

    console.log(`[ASIS] Boot complete in ${Date.now() - this._initTime}ms`);
  }

  private _setupSystemListeners(): void {
    this.eventBus.on('asis:critical:error', (payload) => {
      this._status.health = 'critical';
      this.security.logCriticalEvent('ASIS_CRITICAL_ERROR', payload);
    });

    this.eventBus.on('asis:module:register', (payload) => {
      this._modules.set(payload.name, payload.instance);
      this._status.modules[payload.name] = true;
    });

    setInterval(() => {
      this._status.lastHeartbeat = Date.now();
      this.eventBus.emit('asis:heartbeat', {
        timestamp: Date.now(),
        health: this._status.health,
      });
    }, 30000);
  }

  registerModule(name: string, module: any): void {
    if (this._modules.has(name)) {
      throw new Error(`Module "${name}" already registered`);
    }
    this._modules.set(name, module);
    this._status.modules[name] = true;
    this.eventBus.emit('asis:module:registered', { name, timestamp: Date.now() });
  }

  getModule<T>(name: string): T | undefined {
    return this._modules.get(name);
  }

  get status(): ASISStatus {
    return { ...this._status };
  }

  get isHealthy(): boolean {
    return this._status.health === 'healthy';
  }

  async shutdown(): Promise<void> {
    console.log('[ASIS] Shutdown sequence initiated...');
    this.eventBus.emit('asis:shutdown:start', { timestamp: Date.now() });

    await this.health.shutdown();
    await this.orchestrator.shutdown();
    await this.context.shutdown();
    await this.eventBus.shutdown();
    await this.security.shutdown();

    this._status.initialized = false;
    ASIS.instance = null;
    console.log('[ASIS] Shutdown complete');
  }
}

export { ASISConfig } from './core/config';
export { ASISEventBus } from './core/event-bus';
export { ASISContextEngine } from './core/context-engine';
export { ASISOrchestrator } from './core/orchestrator';
export { ASISSecurityLayer } from './security/security-layer';
export * from './shared/types';
export * from './shared/interfaces';