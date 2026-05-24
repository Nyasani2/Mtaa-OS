// ============================================================
    // LIFECYCLE MANAGER — Module state machine: 6 states
    // Automatic recovery, graceful shutdown, dependency-aware restart
    // ============================================================

    import { ILifecycleManager } from './interfaces';
    import { ModuleState, ModuleRegistration } from './types';
    import { IModuleRegistry } from './interfaces';

    export class LifecycleManager implements ILifecycleManager {
      private registry: IModuleRegistry;
      private stateHistory: Map<string, ModuleState[]> = new Map();
      private recoveryAttempts: Map<string, number> = new Map();
      private readonly MAX_RECOVERY_ATTEMPTS = 3;
      private readonly RECOVERY_DELAY_MS = 5000;

      constructor(registry: IModuleRegistry) {
        this.registry = registry;
      }

      async transition(moduleId: string, toState: ModuleState): Promise<void> {
        const mod = this.registry.get(moduleId);
        if (!mod) throw new Error(`Module ${moduleId} not found`);

        const fromState = mod.state;

        // Validate transition
        if (!this.isValidTransition(fromState, toState)) {
          throw new Error(`Invalid transition: ${fromState} → ${toState}`);
        }

        // Log transition
        const history = this.stateHistory.get(moduleId) || [];
        history.push(toState);
        if (history.length > 20) history.shift();
        this.stateHistory.set(moduleId, history);

        // Execute transition
        mod.state = toState;
        this.registry.register(mod); // re-register with new state

        console.log(`[LifecycleManager] ${moduleId}: ${fromState} → ${toState}`);

        // Auto-recovery triggers
        if (toState === 'failed') {
          await this.handleFailure(moduleId);
        }
        if (toState === 'degraded') {
          await this.handleDegradation(moduleId);
        }
      }

      getState(moduleId: string): ModuleState {
        const mod = this.registry.get(moduleId);
        return mod?.state || 'failed';
      }

      async recover(moduleId: string): Promise<void> {
        const attempts = this.recoveryAttempts.get(moduleId) || 0;
        if (attempts >= this.MAX_RECOVERY_ATTEMPTS) {
          console.error(`[LifecycleManager] Max recovery attempts reached for ${moduleId}`);
          await this.transition(moduleId, 'failed');
          return;
        }

        this.recoveryAttempts.set(moduleId, attempts + 1);
        console.log(`[LifecycleManager] Recovering ${moduleId} (attempt ${attempts + 1}/${this.MAX_RECOVERY_ATTEMPTS})...`);

        // Check dependencies first
        const deps = this.registry.getDependencyTree(moduleId);
        for (const dep of deps) {
          if (dep === moduleId) continue;
          const depMod = this.registry.get(dep);
          if (depMod && depMod.state !== 'active') {
            console.log(`[LifecycleManager] Dependency ${dep} not active, recovering first...`);
            await this.recover(dep);
          }
        }

        // Attempt recovery
        await this.transition(moduleId, 'recovering');

        // In production: actual recovery logic
        await new Promise(r => setTimeout(r, this.RECOVERY_DELAY_MS));

        // Check if recovery succeeded
        const health = await this.registry.checkHealth(moduleId);
        if (health.status === 'healthy') {
          await this.transition(moduleId, 'active');
          this.recoveryAttempts.set(moduleId, 0); // reset on success
          console.log(`[LifecycleManager] ${moduleId} recovered successfully`);
        } else {
          console.warn(`[LifecycleManager] ${moduleId} recovery incomplete, remaining in degraded`);
          await this.transition(moduleId, 'degraded');
        }
      }

      async shutdown(moduleId: string): Promise<void> {
        console.log(`[LifecycleManager] Shutting down ${moduleId}...`);
        await this.transition(moduleId, 'suspended');

        // Notify dependents
        const dependents = this.registry.getDependents(moduleId);
        for (const dep of dependents) {
          console.log(`[LifecycleManager] Notifying dependent ${dep} of shutdown`);
          await this.transition(dep, 'degraded');
        }
      }

      async restart(moduleId: string): Promise<void> {
        console.log(`[LifecycleManager] Restarting ${moduleId}...`);
        await this.shutdown(moduleId);
        await new Promise(r => setTimeout(r, 1000));
        await this.transition(moduleId, 'initializing');
        await new Promise(r => setTimeout(r, 2000));
        await this.transition(moduleId, 'active');
      }

      private isValidTransition(from: ModuleState, to: ModuleState): boolean {
        const validTransitions: Record<ModuleState, ModuleState[]> = {
          initializing: ['active', 'failed'],
          active: ['degraded', 'suspended', 'failed'],
          degraded: ['active', 'recovering', 'suspended', 'failed'],
          suspended: ['initializing', 'active', 'failed'],
          failed: ['recovering', 'suspended'],
          recovering: ['active', 'degraded', 'failed'],
        };
        return validTransitions[from]?.includes(to) ?? false;
      }

      private async handleFailure(moduleId: string): Promise<void> {
        console.error(`[LifecycleManager] Module ${moduleId} entered FAILED state`);
        // Auto-trigger recovery after delay
        setTimeout(() => this.recover(moduleId), this.RECOVERY_DELAY_MS);
      }

      private async handleDegradation(moduleId: string): Promise<void> {
        console.warn(`[LifecycleManager] Module ${moduleId} DEGRADED`);
        // Check if degradation is temporary
        const history = this.stateHistory.get(moduleId) || [];
        const recentDegraded = history.slice(-3).filter(s => s === 'degraded').length;
        if (recentDegraded >= 3) {
          console.log(`[LifecycleManager] ${moduleId} persistently degraded, triggering recovery`);
          await this.recover(moduleId);
        }
      }
    }
    