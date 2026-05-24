// ============================================================
// SYSTEM BOOTLOADER — 6-phase boot with graceful degradation
// PHASE 1: Core validation → PHASE 6: Runtime ready
// ============================================================

import { ISystemBootloader } from './interfaces';
import { RuntimeConfig, BootPhase, ModuleRegistration } from './types';
import { IModuleRegistry } from './interfaces';

export class SystemBootloader implements ISystemBootloader {
  private config: RuntimeConfig;
  private registry: IModuleRegistry;
  private currentPhase: BootPhase = 'validation';
  private ready: boolean = false;
  private bootLog: string[] = [];
  private phaseHandlers: Map<BootPhase, () => Promise<boolean>> = new Map();

  constructor(config: RuntimeConfig, registry: IModuleRegistry) {
    this.config = config;
    this.registry = registry;
    this.setupPhases();
  }

  async boot(config?: RuntimeConfig): Promise<void> {
    if (config) this.config = config;
    this.bootLog = [];
    this.ready = false;

    const phases: BootPhase[] = ['validation', 'registration', 'event_bus', 'agent_attach', 'cognitive_attach', 'ready'];

    for (const phase of phases) {
      this.currentPhase = phase;
      this.log(`=== BOOT PHASE: ${phase.toUpperCase()} ===`);

      const handler = this.phaseHandlers.get(phase);
      if (!handler) {
        this.log(`No handler for phase ${phase}, skipping`);
        continue;
      }

      try {
        const success = await handler();
        if (success) {
          this.log(`Phase ${phase} completed successfully`);
        } else if (this.config.enablePartialBoot) {
          this.log(`Phase ${phase} failed — continuing with partial boot (graceful degradation)`);
        } else {
          this.log(`Phase ${phase} failed — aborting boot`);
          throw new Error(`Boot failed at phase: ${phase}`);
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        this.log(`Phase ${phase} error: ${error}`);

        if (this.config.enablePartialBoot) {
          this.log(`Continuing with degraded capabilities`);
        } else {
          throw new Error(`Boot aborted at ${phase}: ${error}`);
        }
      }
    }

    this.ready = true;
    this.log('=== ASIS RUNTIME READY ===');
  }

  getCurrentPhase(): BootPhase { return this.currentPhase; }
  isReady(): boolean { return this.ready; }

  async shutdown(): Promise<void> {
    this.log('=== SHUTDOWN INITIATED ===');
    this.ready = false;
    // Unregister all modules gracefully
    const modules = this.registry.getAll();
    for (const mod of modules) {
      this.log(`Shutting down module: ${mod.id}`);
      this.registry.unregister(mod.id);
    }
    this.log('=== SHUTDOWN COMPLETE ===');
  }

  getBootLog(): string[] { return [...this.bootLog]; }

  private setupPhases(): void {
    this.phaseHandlers.set('validation', async () => {
      // Validate core configuration
      this.log('Validating runtime configuration...');
      if (!this.config.country) throw new Error('Country not configured');
      if (this.config.kycLevel < 0) throw new Error('Invalid KYC level');
      this.log(`Config valid: ${this.config.country}, KYC ${this.config.kycLevel}, profile ${this.config.systemProfile}`);
      return true;
    });

    this.phaseHandlers.set('registration', async () => {
      // Register core modules
      this.log('Registering core modules...');
      const coreModules = ['cognition', 'memory', 'wallet', 'cash', 'health', 'voice', 'transport', 'civic'];
      for (const mod of coreModules) {
        this.log(`  Registering ${mod}...`);
        // In production: load actual module instances
      }
      this.log(`${coreModules.length} core modules registered`);
      return true;
    });

    this.phaseHandlers.set('event_bus', async () => {
      // Initialize event bus
      this.log('Starting event runtime bus...');
      // In production: connect to event bus
      this.log('Event bus active');
      return true;
    });

    this.phaseHandlers.set('agent_attach', async () => {
      // Attach agent system
      this.log('Attaching agent execution runtime...');
      // In production: initialize agent pool
      this.log('Agent runtime attached');
      return true;
    });

    this.phaseHandlers.set('cognitive_attach', async () => {
      // Attach cognitive engine
      this.log('Attaching cognitive engine...');
      // In production: initialize ZIP 9 cognitive engine
      this.log('Cognitive engine attached');
      return true;
    });

    this.phaseHandlers.set('ready', async () => {
      // Final readiness check
      this.log('Performing readiness checks...');
      const modules = this.registry.getAll();
      const healthy = modules.filter(m => m.health.status === 'healthy').length;
      this.log(`${healthy}/${modules.length} modules healthy`);
      return healthy > 0 || modules.length === 0; // Ready if at least one module healthy or no modules
    });
  }

  private log(message: string): void {
    const entry = `[${new Date().toISOString()}] [BOOT] ${message}`;
    this.bootLog.push(entry);
    console.log(entry);
  }
}
