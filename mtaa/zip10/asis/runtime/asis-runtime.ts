// ============================================================
// ASIS RUNTIME — Main orchestrator connecting ALL ZIPs
// Boot → Register → Execute → Monitor → Recover
// ============================================================

import { RuntimeConfig, ExecutionRequest, ExecutionResult, RuntimeSnapshot } from './types';
import { SystemBootloader } from './system-bootloader';
import { RuntimeKernel } from './runtime-kernel';
import { ModuleRegistry } from './module-registry';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionEngine } from './execution-engine';
import { EventRuntimeBus } from './event-runtime-bus';
import { TaskScheduler } from './task-scheduler';
import { FailureRecovery } from './failure-recovery';
import { PerformanceThrottle } from './performance-throttle';
import { RuntimeMonitor } from './runtime-monitor';
import { ExecutionHooks } from './execution-hooks';
import { PreExecutionHook, PostExecutionHook, FailureHook, SafetyHook } from './hooks';

export class ASISRuntime {
  private config: RuntimeConfig;
  private bootloader: SystemBootloader;
  private kernel: RuntimeKernel;
  private registry: ModuleRegistry;
  private lifecycle: LifecycleManager;
  private executionEngine: ExecutionEngine;
  private eventBus: EventRuntimeBus;
  private scheduler: TaskScheduler;
  private failureRecovery: FailureRecovery;
  private throttle: PerformanceThrottle;
  private monitor: RuntimeMonitor;
  private hooks: ExecutionHooks;
  private ready: boolean = false;

  constructor(config: RuntimeConfig) {
    this.config = config;

    // Initialize in dependency order
    this.registry = new ModuleRegistry();
    this.lifecycle = new LifecycleManager(this.registry);
    this.bootloader = new SystemBootloader(config, this.registry);
    this.eventBus = new EventRuntimeBus();
    this.hooks = new ExecutionHooks();
    this.executionEngine = new ExecutionEngine(this.hooks);
    this.scheduler = new TaskScheduler();
    this.failureRecovery = new FailureRecovery(this.registry, this.lifecycle);
    this.throttle = new PerformanceThrottle(config);
    this.monitor = new RuntimeMonitor(this.registry, this.throttle);

    this.kernel = new RuntimeKernel({
      executionEngine: this.executionEngine,
      eventBus: this.eventBus,
      registry: this.registry,
      lifecycle: this.lifecycle,
      hooks: this.hooks,
    });

    // Register default hooks
    this.hooks.register(PreExecutionHook);
    this.hooks.register(PostExecutionHook);
    this.hooks.register(FailureHook);
    this.hooks.register(SafetyHook);
  }

  async boot(): Promise<void> {
    console.log('=== ASIS RUNTIME BOOT ===');
    await this.bootloader.boot(this.config);
    this.ready = this.bootloader.isReady();

    if (this.ready) {
      // Start background tasks
      this.startBackgroundTasks();
    }

    console.log(`=== ASIS RUNTIME ${this.ready ? 'READY' : 'DEGRADED'} ===`);
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.ready) {
      return {
        requestId: request.id, status: 'failed', output: null,
        errors: ['ASIS Runtime not ready'], executionTimeMs: 0,
        tasksCompleted: 0, tasksFailed: 1, rolledBack: false,
        completedAt: new Date().toISOString(),
      };
    }

    // Apply throttling
    if (this.throttle.shouldThrottle()) {
      const adaptiveConfig = this.throttle.getAdaptiveConfig();
      request.timeoutMs = adaptiveConfig.defaultTimeoutMs || request.timeoutMs;
    }

    // Execute through kernel
    const result = await this.kernel.execute(request);

    // Track metrics
    this.monitor.trackLatency(request.source, result.executionTimeMs);
    if (result.status === 'failed') {
      this.monitor.trackFailure(request.source, result.errors.join(', '));
    }

    // Update throttle
    this.throttle.updateMetrics({
      cpu: 0, // In production: actual CPU reading
      memory: 0, // In production: actual memory reading
      active: this.monitor.getMetrics().activeExecutions || 0,
      queue: this.eventBus.getQueueDepth(),
      rate: this.monitor.getMetrics().totalExecutions || 0,
    });

    return result;
  }

  async schedule(request: ExecutionRequest, delayMs: number): Promise<string> {
    return this.scheduler.schedule(request, delayMs);
  }

  async shutdown(): Promise<void> {
    console.log('=== ASIS RUNTIME SHUTDOWN ===');
    await this.bootloader.shutdown();
    this.ready = false;
  }

  getSnapshot(): RuntimeSnapshot {
    return this.monitor.snapshot();
  }

  getHealthReport(): string {
    return this.monitor.getHealthReport();
  }

  getSystemState(): Record<string, string> {
    return this.kernel.getSystemState();
  }

  isReady(): boolean {
    return this.ready;
  }

  private startBackgroundTasks(): void {
    // Health check interval
    setInterval(async () => {
      const modules = this.registry.getAll();
      for (const mod of modules) {
        await this.registry.checkHealth(mod.id);
      }
    }, 30000); // every 30s

    // Scheduler processing
    setInterval(async () => {
      await this.scheduler.processQueue();
    }, 5000); // every 5s

    // Throttle monitoring
    setInterval(() => {
      this.throttle.updateMetrics({
        cpu: 0, memory: 0,
        active: this.monitor.getMetrics().activeExecutions || 0,
        queue: this.eventBus.getQueueDepth(),
        rate: this.monitor.getMetrics().totalExecutions || 0,
      });
    }, 10000); // every 10s
  }
}
