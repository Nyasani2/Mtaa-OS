/**
 * ASIS CSE — Diagnostic Engine
 * Self-health MRI for the cognitive architecture
 * Detects stuck engines, confidence decay, cascading failures, circular logic
 */

import {
  CognitiveEventBus,
  CognitiveEventType,
  EventPriority,
} from './asis-cse-event-system';
import { MetricsEngine } from './asis-cse-metrics-engine';
import { CognitiveClock } from './asis-cse-clock';

export interface DiagnosticFinding {
  severity: 'critical' | 'warning' | 'info';
  category: 'engine_health' | 'performance' | 'memory' | 'security' | 'logic' | 'stability' | 'connectivity';
  engine?: string;
  description: string;
  recommendation: string;
  confidence: number;
  autoRemediate?: boolean;
}

export interface DiagnosticReport {
  timestamp: number;
  overallHealth: number; // 0-1
  findings: DiagnosticFinding[];
  engineHealth: Record<string, number>;
  anomalies: string[];
  remediation: string[];
  autoActions: string[];
  cycleAnalyzed: number;
}

export class DiagnosticEngine {
  private eventBus?: CognitiveEventBus;
  private metricsEngine?: MetricsEngine;
  private clock?: CognitiveClock;
  private lastReport?: DiagnosticReport;
  private findings: DiagnosticFinding[] = [];
  private healthHistory: number[] = [];
  private autoRemediateEnabled = false;

  constructor(
    eventBus?: CognitiveEventBus,
    metricsEngine?: MetricsEngine,
    clock?: CognitiveClock
  ) {
    this.eventBus = eventBus;
    this.metricsEngine = metricsEngine;
    this.clock = clock;
  }

  enableAutoRemediate(enabled: boolean): void {
    this.autoRemediateEnabled = enabled;
  }

  async runDiagnostics(): Promise<DiagnosticReport> {
    this.findings = [];

    await this.checkEngineHealth();
    await this.checkPerformance();
    await this.checkMemory();
    await this.checkSecurity();
    await this.checkLogic();
    await this.checkStability();
    await this.checkConnectivity();

    const overallHealth = this.calculateOverallHealth();
    this.healthHistory.push(overallHealth);
    if (this.healthHistory.length > 100) this.healthHistory.shift();

    const autoActions = this.autoRemediateEnabled ? this.generateAutoActions() : [];

    const report: DiagnosticReport = {
      timestamp: Date.now(),
      overallHealth,
      findings: [...this.findings],
      engineHealth: this.getEngineHealthMap(),
      anomalies: this.findings.filter((f) => f.severity !== 'info').map((f) => `[${f.severity.toUpperCase()}] ${f.description}`),
      remediation: this.findings.filter((f) => f.severity !== 'info').map((f) => f.recommendation),
      autoActions,
      cycleAnalyzed: this.clock?.getCycleNumber() || 0,
    };

    this.lastReport = report;

    this.emitEvent(CognitiveEventType.HEALTH_CHECK, {
      report,
      overallHealth,
      findingsCount: this.findings.length,
      criticalCount: this.findings.filter((f) => f.severity === 'critical').length,
    });

    return report;
  }

  private async checkEngineHealth(): Promise<void> {
    if (!this.metricsEngine) return;
    const snapshot = this.metricsEngine.takeSnapshot();

    Object.entries(snapshot.engineMetrics).forEach(([name, metric]) => {
      if (metric.healthScore < 0.2) {
        this.findings.push({
          severity: 'critical',
          category: 'engine_health',
          engine: name,
          description: `${name} health critically low at ${(metric.healthScore * 100).toFixed(0)}%`,
          recommendation: `Restart ${name} or investigate error logs. Error rate: ${(metric.errorRate * 100).toFixed(1)}%`,
          confidence: 0.95,
          autoRemediate: true,
        });
      } else if (metric.healthScore < 0.5) {
        this.findings.push({
          severity: 'warning',
          category: 'engine_health',
          engine: name,
          description: `${name} health degraded at ${(metric.healthScore * 100).toFixed(0)}%`,
          recommendation: `Monitor ${name} closely. Consider reducing load or checking dependencies.`,
          confidence: 0.85,
        });
      }

      if (metric.consecutiveErrors >= 5) {
        this.findings.push({
          severity: 'critical',
          category: 'engine_health',
          engine: name,
          description: `${name} has failed ${metric.consecutiveErrors} times consecutively`,
          recommendation: `Circuit-break ${name} and route to fallback engine.`,
          confidence: 0.9,
          autoRemediate: true,
        });
      }

      if (metric.executionCount === 0 && snapshot.systemMetrics.totalEngineExecutions > 10) {
        this.findings.push({
          severity: 'warning',
          category: 'engine_health',
          engine: name,
          description: `${name} has never executed but system is running`,
          recommendation: `Verify ${name} is registered in the engine pipeline and receiving inputs.`,
          confidence: 0.7,
        });
      }
    });
  }

  private async checkPerformance(): Promise<void> {
    if (!this.clock) return;
    const avgDuration = this.clock.getAverageCycleDuration();
    if (avgDuration > 1000) {
      this.findings.push({
        severity: 'warning',
        category: 'performance',
        description: `Average cycle duration ${avgDuration.toFixed(0)}ms exceeds 1000ms threshold`,
        recommendation: 'Consider reducing engine pipeline depth or enabling burst mode.',
        confidence: 0.9,
      });
    }

    if (!this.metricsEngine) return;
    const snapshot = this.metricsEngine.takeSnapshot();
    Object.entries(snapshot.engineMetrics).forEach(([name, metric]) => {
      if (metric.averageExecutionTime > 2000) {
        this.findings.push({
          severity: 'warning',
          category: 'performance',
          engine: name,
          description: `${name} average execution time ${metric.averageExecutionTime.toFixed(0)}ms is high`,
          recommendation: `Optimize ${name} or run it asynchronously.`,
          confidence: 0.85,
        });
      }
    });
  }

  private async checkMemory(): Promise<void> {
    if (!this.metricsEngine) return;
    const snapshot = this.metricsEngine.takeSnapshot();
    const memUsage = snapshot.systemMetrics.memoryUsageEstimate;
    if (memUsage > 50_000_000) {
      this.findings.push({
        severity: 'warning',
        category: 'memory',
        description: `Estimated memory usage ${(memUsage / 1_000_000).toFixed(1)}MB is high`,
        recommendation: 'Clear metric snapshots or reduce history retention.',
        confidence: 0.8,
      });
    }
  }

  private async checkSecurity(): Promise<void> {
    if (!this.metricsEngine) return;
    const snapshot = this.metricsEngine.takeSnapshot();
    const highErrorEngines = Object.entries(snapshot.engineMetrics).filter(([_, m]) => m.errorRate > 0.5);
    if (highErrorEngines.length > 3) {
      this.findings.push({
        severity: 'critical',
        category: 'security',
        description: `Multiple engines (${highErrorEngines.length}) showing >50% error rates`,
        recommendation: 'Potential system compromise or cascading failure. Initiate security audit.',
        confidence: 0.75,
      });
    }
  }

  private async checkLogic(): Promise<void> {
    if (this.healthHistory.length > 10) {
      const recent = this.healthHistory.slice(-10);
      const declining = recent.every((h, i) => i === 0 || h <= recent[i - 1] + 0.03);
      if (declining && recent[0] > recent[recent.length - 1] + 0.15) {
        this.findings.push({
          severity: 'critical',
          category: 'logic',
          description: 'System health declining consistently over last 10 diagnostic cycles',
          recommendation: 'Run full system audit. Check for feedback loops or negative reinforcement.',
          confidence: 0.8,
        });
      }
    }

    // Detect confidence decay across all engines
    if (this.metricsEngine) {
      const snapshot = this.metricsEngine.takeSnapshot();
      const lowConfidenceEngines = Object.entries(snapshot.engineMetrics).filter(([_, m]) => m.averageConfidence < 0.3);
      if (lowConfidenceEngines.length > 3) {
        this.findings.push({
          severity: 'warning',
          category: 'logic',
          description: `${lowConfidenceEngines.length} engines showing confidence below 30%`,
          recommendation: 'Review training data or knowledge base. System may be operating outside its domain.',
          confidence: 0.75,
        });
      }
    }
  }

  private async checkStability(): Promise<void> {
    if (!this.clock) return;
    if (!this.clock.isClockRunning()) {
      this.findings.push({
        severity: 'critical',
        category: 'stability',
        description: 'Cognitive clock is not running',
        recommendation: 'Restart the cognitive clock immediately to resume processing.',
        confidence: 0.95,
      });
    }

    const avgLatency = this.clock.getAverageLatency();
    if (avgLatency > 500) {
      this.findings.push({
        severity: 'warning',
        category: 'stability',
        description: `Clock latency ${avgLatency.toFixed(0)}ms is high`,
        recommendation: 'Event loop may be blocked. Check for synchronous operations in engine pipeline.',
        confidence: 0.8,
      });
    }
  }

  private async checkConnectivity(): Promise<void> {
    if (!this.eventBus) return;
    const queueDepth = this.eventBus.getQueueDepth();
    if (queueDepth > 50) {
      this.findings.push({
        severity: 'warning',
        category: 'connectivity',
        description: `Event queue depth ${queueDepth} is high`,
        recommendation: 'Event bus may be backlogged. Add more handlers or reduce event frequency.',
        confidence: 0.8,
      });
    }

    const subscriberCount = this.eventBus.getSubscriberCount();
    if (subscriberCount === 0) {
      this.findings.push({
        severity: 'warning',
        category: 'connectivity',
        description: 'Event bus has zero subscribers',
        recommendation: 'Engines are not connected to the event bus. Register subscribers during initialization.',
        confidence: 0.9,
      });
    }
  }

  private calculateOverallHealth(): number {
    if (this.findings.length === 0) return 1.0;
    const criticalCount = this.findings.filter((f) => f.severity === 'critical').length;
    const warningCount = this.findings.filter((f) => f.severity === 'warning').length;
    let health = 1.0;
    health -= criticalCount * 0.25;
    health -= warningCount * 0.08;
    return Math.max(0, health);
  }

  private getEngineHealthMap(): Record<string, number> {
    if (!this.metricsEngine) return {};
    const snapshot = this.metricsEngine.takeSnapshot();
    const map: Record<string, number> = {};
    Object.entries(snapshot.engineMetrics).forEach(([name, metric]) => {
      map[name] = metric.healthScore;
    });
    return map;
  }

  private generateAutoActions(): string[] {
    const actions: string[] = [];
    this.findings.forEach((f) => {
      if (f.autoRemediate && f.severity === 'critical') {
        actions.push(`AUTO: ${f.recommendation}`);
      }
    });
    return actions;
  }

  getLastReport(): DiagnosticReport | undefined {
    return this.lastReport;
  }

  getHealthTrend(): 'improving' | 'stable' | 'declining' | 'unknown' {
    if (this.healthHistory.length < 5) return 'unknown';
    const recent = this.healthHistory.slice(-5);
    const older = this.healthHistory.slice(-10, -5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 0.05) return 'improving';
    if (recentAvg < olderAvg - 0.05) return 'declining';
    return 'stable';
  }

  generateReport(): string {
    const report = this.lastReport;
    if (!report) return 'No diagnostic report available. Run runDiagnostics() first.';

    const lines = [
      '═══════════════════════════════════════',
      '     ASIS CSE — DIAGNOSTIC REPORT',
      '═══════════════════════════════════════',
      `Timestamp:      ${new Date(report.timestamp).toISOString()}`,
      `Overall Health: ${(report.overallHealth * 100).toFixed(1)}%`,
      `Health Trend:   ${this.getHealthTrend()}`,
      `Cycle Analyzed: ${report.cycleAnalyzed}`,
      `Findings:       ${report.findings.length}`,
      ``,
    ];

    if (report.findings.length > 0) {
      lines.push('Findings:');
      report.findings.forEach((f) => {
        const icon = f.severity === 'critical' ? '❌' : f.severity === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`  ${icon} [${f.category}] ${f.description}`);
        lines.push(`     → ${f.recommendation}`);
      });
      lines.push('');
    }

    if (report.autoActions.length > 0) {
      lines.push('Auto-Remediation Actions:');
      report.autoActions.forEach((a) => lines.push(`  • ${a}`));
      lines.push('');
    }

    lines.push('Engine Health Map:');
    Object.entries(report.engineHealth).forEach(([name, health]) => {
      const bar = '█'.repeat(Math.round(health * 20)).padEnd(20, '░');
      lines.push(`  ${name.padEnd(24)} ${bar} ${(health * 100).toFixed(0)}%`);
    });

    lines.push('═══════════════════════════════════════');
    return lines.join('\n');
  }

  private emitEvent(type: CognitiveEventType, payload: any): void {
    if (this.eventBus) {
      this.eventBus.publish({
        type,
        payload,
        source: 'DiagnosticEngine',
        priority: EventPriority.HIGH,
      });
    }
  }

  async process(input: any): Promise<DiagnosticReport> {
    return this.runDiagnostics();
  }
}
