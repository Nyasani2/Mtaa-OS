// ============================================================
// FAILURE RECOVERY — Circuit breaker, rollback, degraded mode
// Detect, isolate, recover, restart safe state
// ============================================================

import { IFailureRecovery } from './interfaces';
import { FailureRecord, RecoveryStrategy } from './types';
import { IModuleRegistry } from './interfaces';
import { ILifecycleManager } from './interfaces';

export class FailureRecovery implements IFailureRecovery {
  private registry: IModuleRegistry;
  private lifecycle: ILifecycleManager;
  private failures: Map<string, FailureRecord[]> = new Map();
  private circuitStates: Map<string, { state: 'closed' | 'open' | 'half_open'; failures: number; lastFailure: number; threshold: number; resetTimeout: number }> = new Map();
  private readonly DEFAULT_THRESHOLD = 5;
  private readonly DEFAULT_RESET_MS = 30000;

  constructor(registry: IModuleRegistry, lifecycle: ILifecycleManager) {
    this.registry = registry;
    this.lifecycle = lifecycle;
  }

  async detect(moduleId: string, error: Error): Promise<FailureRecord> {
    const existing = this.failures.get(moduleId) || [];
    const impact = this.assessImpact(moduleId, error);

    const record: FailureRecord = {
      id: `fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      moduleId,
      error: error.message,
      stackTrace: error.stack,
      timestamp: new Date().toISOString(),
      recoveryStrategy: this.determineStrategy(moduleId, error, existing.length),
      recovered: false,
      recoveryAttempts: 0,
      impact,
    };

    existing.push(record);
    this.failures.set(moduleId, existing);

    // Update circuit breaker
    this.updateCircuitBreaker(moduleId);

    console.error(`[FailureRecovery] Failure detected in ${moduleId}: ${error.message} (impact: ${impact})`);
    return record;
  }

  async recover(record: FailureRecord): Promise<boolean> {
    record.recoveryAttempts++;
    console.log(`[FailureRecovery] Recovering ${record.moduleId} (attempt ${record.recoveryAttempts}, strategy: ${record.recoveryStrategy})`);

    try {
      switch (record.recoveryStrategy) {
        case 'retry':
          return await this.retryRecovery(record);
        case 'rollback':
          return await this.rollbackRecovery(record);
        case 'degrade':
          return await this.degradeRecovery(record);
        case 'isolate':
          return await this.isolateRecovery(record);
        case 'restart':
          return await this.restartRecovery(record);
        default:
          return false;
      }
    } catch (err) {
      console.error(`[FailureRecovery] Recovery failed for ${record.moduleId}:`, err);
      return false;
    }
  }

  async isolate(moduleId: string): Promise<void> {
    console.log(`[FailureRecovery] Isolating module ${moduleId}`);
    await this.lifecycle.transition(moduleId, 'suspended');

    // Notify dependents to degrade
    const dependents = this.registry.getDependents(moduleId);
    for (const dep of dependents) {
      console.log(`[FailureRecovery] Degrading dependent ${dep}`);
      await this.lifecycle.transition(dep, 'degraded');
    }
  }

  getCircuitState(moduleId: string): 'closed' | 'open' | 'half_open' {
    const circuit = this.circuitStates.get(moduleId);
    if (!circuit) return 'closed';

    // Check if enough time has passed to move from open to half-open
    if (circuit.state === 'open' && Date.now() - circuit.lastFailure > circuit.resetTimeout) {
      circuit.state = 'half_open';
      circuit.failures = 0;
      this.circuitStates.set(moduleId, circuit);
    }

    return circuit.state;
  }

  private async retryRecovery(record: FailureRecord): Promise<boolean> {
    // Simple retry: attempt to transition back to active
    await this.lifecycle.recover(record.moduleId);
    const mod = this.registry.get(record.moduleId);
    record.recovered = mod?.state === 'active' || mod?.state === 'degraded';
    return record.recovered;
  }

  private async rollbackRecovery(record: FailureRecord): Promise<boolean> {
    // Rollback to previous known good state
    console.log(`[FailureRecovery] Rolling back ${record.moduleId} to previous state`);
    await this.lifecycle.transition(record.moduleId, 'suspended');
    await new Promise(r => setTimeout(r, 1000));
    await this.lifecycle.transition(record.moduleId, 'initializing');
    await new Promise(r => setTimeout(r, 2000));
    await this.lifecycle.transition(record.moduleId, 'active');

    const mod = this.registry.get(record.moduleId);
    record.recovered = mod?.state === 'active';
    return record.recovered;
  }

  private async degradeRecovery(record: FailureRecord): Promise<boolean> {
    // Run in degraded mode with limited functionality
    await this.lifecycle.transition(record.moduleId, 'degraded');
    record.recovered = true; // degraded is considered "recovered" (functional but limited)
    console.log(`[FailureRecovery] ${record.moduleId} running in degraded mode`);
    return true;
  }

  private async isolateRecovery(record: FailureRecord): Promise<boolean> {
    await this.isolate(record.moduleId);
    record.recovered = false; // isolated is not recovered
    return false;
  }

  private async restartRecovery(record: FailureRecord): Promise<boolean> {
    await this.lifecycle.restart(record.moduleId);
    const mod = this.registry.get(record.moduleId);
    record.recovered = mod?.state === 'active';
    return record.recovered;
  }

  private determineStrategy(moduleId: string, error: Error, failureCount: number): RecoveryStrategy {
    const circuit = this.circuitStates.get(moduleId);

    if (circuit?.state === 'open') {
      return 'isolate'; // Circuit open: isolate immediately
    }

    if (failureCount === 0) {
      return 'retry'; // First failure: just retry
    }
    if (failureCount < 3) {
      return 'rollback'; // Few failures: rollback to known state
    }
    if (failureCount < 5) {
      return 'degrade'; // Many failures: run degraded
    }
    return 'restart'; // Persistent failures: full restart
  }

  private assessImpact(moduleId: string, error: Error): FailureRecord['impact'] {
    const dependents = this.registry.getDependents(moduleId);
    if (dependents.length === 0) return 'isolated';
    if (dependents.length > 3) return 'system_wide';
    return 'cascading';
  }

  private updateCircuitBreaker(moduleId: string): void {
    let circuit = this.circuitStates.get(moduleId);
    if (!circuit) {
      circuit = {
        state: 'closed',
        failures: 0,
        lastFailure: 0,
        threshold: this.DEFAULT_THRESHOLD,
        resetTimeout: this.DEFAULT_RESET_MS,
      };
    }

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= circuit.threshold) {
      circuit.state = 'open';
      console.warn(`[FailureRecovery] Circuit breaker OPEN for ${moduleId} (${circuit.failures} failures)`);
    }

    this.circuitStates.set(moduleId, circuit);
  }
}
