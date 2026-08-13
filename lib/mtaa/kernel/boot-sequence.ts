// lib/mtaa/kernel/boot-sequence.ts
import { serviceManager } from './service-manager';
import { memoryWatchdog } from './memory-watchdog';

export interface BootPhase { name: string; priority: number; services: string[]; timeoutMs: number; critical: boolean; }
export interface BootResult { phase: string; success: boolean; services: { name: string; loaded: boolean; error?: string }[]; durationMs: number; }

const BOOT_PHASES: BootPhase[] = [
  { name: 'kernel', priority: 0, services: ['supabase','config','registry'], timeoutMs: 5000, critical: true },
  { name: 'auth', priority: 1, services: ['auth','user','permissions'], timeoutMs: 3000, critical: true },
  { name: 'wallet', priority: 2, services: ['wallet','transactions','escrow'], timeoutMs: 4000, critical: true },
  { name: 'network', priority: 3, services: ['sync','cache','rails'], timeoutMs: 5000, critical: false },
  { name: 'apps', priority: 4, services: ['appstore','notifications','deeplinks'], timeoutMs: 6000, critical: false },
];

class BootSequence {
  private results: BootResult[] = []; private aborted = false;
  async boot(): Promise<BootResult[]> {
    // Boot event logged via kernel observability
    for (const phase of BOOT_PHASES.sort((a,b) => a.priority - b.priority)) {
      if (this.aborted) break;
      const result = await this.runPhase(phase); this.results.push(result);
      if (!result.success && phase.critical) { console.error(`[BOOT] CRITICAL PHASE FAILED: ${phase.name}`); this.aborted = true; break; }
    }
    // Boot event logged via kernel observability
    return this.results;
  }
  private async runPhase(phase: BootPhase): Promise<BootResult> {
    const start = Date.now(); const services: BootResult['services'] = [];
    for (const serviceName of phase.services) {
      try {
        await Promise.race([serviceManager.load(serviceName), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), phase.timeoutMs))]);
        services.push({ name: serviceName, loaded: true });
      } catch (error) { services.push({ name: serviceName, loaded: false, error: error instanceof Error ? error.message : 'Unknown error' }); }
    }
    const success = services.every((s: any) => s.loaded);
    return { phase: phase.name, success, services, durationMs: Date.now() - start };
  }
  getStatus(): { phase: string; state: 'ok'|'failed'|'pending' }[] {
    return this.results.map((r: any) => ({ phase: r.phase, state: r.success ? 'ok' : 'failed' }));
  }
}
export const bootSequence = new BootSequence();

