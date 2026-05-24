// ============================================================
// RUNTIME MONITOR — System health, metrics, latency, stability
// Snapshot, performance report, stability score
// ============================================================

import { IRuntimeMonitor } from './interfaces';
import { RuntimeSnapshot, ModuleState, ModuleRegistration } from './types';
import { IModuleRegistry } from './interfaces';
import { IPerformanceThrottle } from './interfaces';

export class RuntimeMonitor implements IRuntimeMonitor {
  private registry: IModuleRegistry;
  private throttle: IPerformanceThrottle;
  private latencyHistory: Map<string, number[]> = new Map();
  private failureHistory: Map<string, string[]> = new Map();
  private startTime: number = Date.now();
  private snapshotHistory: RuntimeSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 100;

  constructor(registry: IModuleRegistry, throttle: IPerformanceThrottle) {
    this.registry = registry;
    this.throttle = throttle;
  }

  snapshot(): RuntimeSnapshot {
    const modules = this.registry.getAll();
    const moduleStates: Record<string, ModuleState> = {};
    for (const mod of modules) {
      moduleStates[mod.id] = mod.state;
    }

    const activeExecutions = modules.filter(m => m.state === 'active').length;
    const failedModules = modules.filter(m => m.state === 'failed').length;
    const totalModules = modules.length;

    const throttleState = this.throttle.getState();

    let systemHealth: RuntimeSnapshot['systemHealth'] = 'healthy';
    if (failedModules > totalModules * 0.3 || throttleState.level === 'emergency') {
      systemHealth = 'critical';
    } else if (failedModules > 0 || throttleState.level === 'minimal') {
      systemHealth = 'degraded';
    }

    const snapshot: RuntimeSnapshot = {
      timestamp: new Date().toISOString(),
      bootPhase: 'ready', // In production: get from bootloader
      moduleStates,
      activeExecutions,
      queuedExecutions: throttleState.queueDepth,
      eventQueueDepth: 0, // In production: get from event bus
      throttleLevel: throttleState.level,
      systemHealth,
      uptimeMs: Date.now() - this.startTime,
      failureRate: this.calculateFailureRate(),
      avgLatencyMs: this.calculateAvgLatency(),
    };

    this.snapshotHistory.push(snapshot);
    if (this.snapshotHistory.length > this.MAX_SNAPSHOTS) this.snapshotHistory.shift();

    return snapshot;
  }

  getMetrics(moduleId?: string): Record<string, number> {
    if (moduleId) {
      const latencies = this.latencyHistory.get(moduleId) || [];
      const failures = this.failureHistory.get(moduleId) || [];
      return {
        avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
        minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        failureCount: failures.length,
        successRate: latencies.length > 0 ? (latencies.length - failures.length) / latencies.length : 1,
      };
    }

    // System-wide metrics
    let totalLatency = 0;
    let totalSamples = 0;
    let totalFailures = 0;

    for (const [_, latencies] of this.latencyHistory.entries()) {
      totalLatency += latencies.reduce((a, b) => a + b, 0);
      totalSamples += latencies.length;
    }
    for (const [_, failures] of this.failureHistory.entries()) {
      totalFailures += failures.length;
    }

    return {
      avgLatency: totalSamples > 0 ? totalLatency / totalSamples : 0,
      totalExecutions: totalSamples,
      totalFailures,
      systemUptimeMinutes: (Date.now() - this.startTime) / 60000,
      moduleCount: this.registry.getAll().length,
      healthyModules: this.registry.getAll().filter(m => m.state === 'active').length,
    };
  }

  trackLatency(moduleId: string, durationMs: number): void {
    const existing = this.latencyHistory.get(moduleId) || [];
    existing.push(durationMs);
    if (existing.length > 100) existing.shift();
    this.latencyHistory.set(moduleId, existing);
  }

  trackFailure(moduleId: string, error: string): void {
    const existing = this.failureHistory.get(moduleId) || [];
    existing.push(error);
    if (existing.length > 50) existing.shift();
    this.failureHistory.set(moduleId, existing);
  }

  getHealthReport(): string {
    const snapshot = this.snapshot();
    const metrics = this.getMetrics();

    const lines: string[] = [];
    lines.push('=== ASIS RUNTIME HEALTH REPORT ===');
    lines.push(`Timestamp: ${snapshot.timestamp}`);
    lines.push(`Uptime: ${Math.floor(metrics.systemUptimeMinutes)} minutes`);
    lines.push(`System Health: ${snapshot.systemHealth.toUpperCase()}`);
    lines.push(`Throttle Level: ${snapshot.throttleLevel}`);
    lines.push('');
    lines.push('--- Module Status ---');
    for (const [id, state] of Object.entries(snapshot.moduleStates)) {
      const mod = this.registry.get(id);
      lines.push(`  ${id}: ${state} (${mod?.health.status || 'unknown'})`);
    }
    lines.push('');
    lines.push('--- Performance ---');
    lines.push(`  Active Executions: ${snapshot.activeExecutions}`);
    lines.push(`  Queued: ${snapshot.queuedExecutions}`);
    lines.push(`  Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);
    lines.push(`  Failure Rate: ${(snapshot.failureRate * 100).toFixed(1)}%`);
    lines.push(`  Total Executions: ${metrics.totalExecutions}`);
    lines.push('');
    lines.push('--- Stability Score ---');
    lines.push(`  ${this.calculateStabilityScore()}/100`);

    return lines.join('\n');
  }

  private calculateFailureRate(): number {
    let total = 0;
    let failures = 0;
    for (const [_, latencies] of this.latencyHistory.entries()) total += latencies.length;
    for (const [_, fails] of this.failureHistory.entries()) failures += fails.length;
    return total > 0 ? failures / total : 0;
  }

  private calculateAvgLatency(): number {
    let total = 0;
    let count = 0;
    for (const [_, latencies] of this.latencyHistory.entries()) {
      total += latencies.reduce((a, b) => a + b, 0);
      count += latencies.length;
    }
    return count > 0 ? total / count : 0;
  }

  private calculateStabilityScore(): number {
    const metrics = this.getMetrics();
    const snapshot = this.snapshotHistory[this.snapshotHistory.length - 1];

    if (!snapshot) return 100;

    let score = 100;

    // Deduct for failures
    score -= metrics.totalFailures * 5;

    // Deduct for high latency
    if (metrics.avgLatency > 1000) score -= 10;
    if (metrics.avgLatency > 3000) score -= 20;

    // Deduct for degraded modules
    const degradedCount = Object.values(snapshot.moduleStates).filter(s => s === 'degraded').length;
    score -= degradedCount * 10;

    // Deduct for failed modules
    const failedCount = Object.values(snapshot.moduleStates).filter(s => s === 'failed').length;
    score -= failedCount * 20;

    // Deduct for emergency throttle
    if (snapshot.throttleLevel === 'emergency') score -= 30;
    else if (snapshot.throttleLevel === 'minimal') score -= 15;
    else if (snapshot.throttleLevel === 'reduced') score -= 5;

    return Math.max(0, Math.min(100, score));
  }
}
