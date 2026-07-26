/**
 * ASIS CSE — Metrics Engine
 * Operational observability for all 22+ engines
 * Tracks execution, confidence trends, health scoring, and system-wide telemetry
 */

import { EngineInput, EngineResult } from './asis-cse-types';
import {
  CognitiveEventBus,
  CognitiveEventType,
  EventPriority,
} from './asis-cse-event-system';
import { kamosMultiply } from './asis-cse-kamos';

export interface MetricSnapshot {
  timestamp: number;
  cycle: number;
  engineMetrics: Record<string, EngineMetric>;
  systemMetrics: SystemMetric;
  trendMetrics: TrendMetric;
}

export interface EngineMetric {
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  errorCount: number;
  errorRate: number;
  averageConfidence: number;
  lastExecutionTime?: number;
  lastResult?: EngineResult;
  healthScore: number; // 0-1
  consecutiveErrors: number;
  consecutiveSuccesses: number;
}

export interface SystemMetric {
  totalCycles: number;
  totalEngineExecutions: number;
  totalErrors: number;
  systemHealthScore: number;
  uptime: number;
  memoryUsageEstimate: number;
  eventQueueDepth: number;
  activeContexts: number;
  timestamp: number;
}

export interface TrendMetric {
  confidenceTrend: 'rising' | 'stable' | 'falling';
  errorTrend: 'rising' | 'stable' | 'falling';
  performanceTrend: 'rising' | 'stable' | 'falling';
  wisdomGrowthRate: number;
  knowledgeAccumulationRate: number;
  healthTrend: 'rising' | 'stable' | 'falling';
}

export interface MetricsReport {
  snapshot: MetricSnapshot;
  textReport: string;
  alerts: string[];
}

export class MetricsEngine {
  private engineMetrics: Map<string, EngineMetric> = new Map();
  private snapshots: MetricSnapshot[] = [];
  private startTime: number = Date.now();
  private cycleCount = 0;
  private eventBus?: CognitiveEventBus;
  private activeContexts = 0;

  constructor(eventBus?: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  recordEngineExecution(
    engineName: string,
    input: EngineInput,
    result: EngineResult,
    executionTimeMs: number
  ): void {
    let metric = this.engineMetrics.get(engineName);
    if (!metric) {
      metric = {
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        errorRate: 0,
        averageConfidence: 0.5,
        healthScore: 1.0,
        consecutiveErrors: 0,
        consecutiveSuccesses: 0,
      };
      this.engineMetrics.set(engineName, metric);
    }

    metric.executionCount++;
    metric.totalExecutionTime += executionTimeMs;
    metric.averageExecutionTime =
      metric.totalExecutionTime / metric.executionCount;
    metric.lastExecutionTime = executionTimeMs;
    metric.lastResult = result;

    if (!result.success) {
      metric.errorCount++;
      metric.consecutiveErrors++;
      metric.consecutiveSuccesses = 0;
    } else {
      metric.consecutiveErrors = 0;
      metric.consecutiveSuccesses++;
    }
    metric.errorRate = metric.errorCount / metric.executionCount;

    // Update average confidence using KAMOS-weighted accumulation
    const currentConfidence = result.confidence?.overall || 0.5;
    metric.averageConfidence = kamosMultiply(
      metric.averageConfidence,
      currentConfidence
    );

    // Health score: recovers slowly with success, drops fast with consecutive errors
    if (metric.consecutiveErrors >= 3) {
      metric.healthScore = Math.max(0, metric.healthScore - 0.2);
    } else if (metric.consecutiveSuccesses >= 5) {
      metric.healthScore = Math.min(1, metric.healthScore + 0.05);
    } else if (!result.success) {
      metric.healthScore = Math.max(0, metric.healthScore - 0.08);
    } else {
      metric.healthScore = Math.min(1, metric.healthScore + 0.02);
    }

    this.emitEvent(CognitiveEventType.METRICS_SNAPSHOT, {
      engineName,
      executionTimeMs,
      confidence: currentConfidence,
      healthScore: metric.healthScore,
      errorRate: metric.errorRate,
    });
  }

  recordCycleCompletion(): void {
    this.cycleCount++;
    const snapshot = this.takeSnapshot();
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }

    // Emit system-level metrics event
    this.emitEvent(CognitiveEventType.METRICS_SNAPSHOT, {
      type: 'cycle_complete',
      cycle: this.cycleCount,
      systemHealth: snapshot.systemMetrics.systemHealthScore,
    });
  }

  recordContextCreated(): void {
    this.activeContexts++;
  }

  recordContextDestroyed(): void {
    this.activeContexts = Math.max(0, this.activeContexts - 1);
  }

  takeSnapshot(): MetricSnapshot {
    const engineMetrics: Record<string, EngineMetric> = {};
    this.engineMetrics.forEach((metric, name) => {
      engineMetrics[name] = { ...metric };
    });

    const totalExecutions = Object.values(engineMetrics).reduce(
      (sum, m) => sum + m.executionCount,
      0
    );
    const totalErrors = Object.values(engineMetrics).reduce(
      (sum, m) => sum + m.errorCount,
      0
    );
    const avgHealth =
      Object.values(engineMetrics).reduce(
        (sum, m) => sum + m.healthScore,
        0
      ) / (Object.keys(engineMetrics).length || 1);

    return {
      timestamp: Date.now(),
      cycle: this.cycleCount,
      engineMetrics,
      systemMetrics: {
        totalCycles: this.cycleCount,
        totalEngineExecutions: totalExecutions,
        totalErrors: totalErrors,
        systemHealthScore: avgHealth,
        uptime: Date.now() - this.startTime,
        memoryUsageEstimate: this.estimateMemoryUsage(),
        eventQueueDepth: this.eventBus?.getQueueDepth() || 0,
        activeContexts: this.activeContexts,
        timestamp: Date.now(),
      },
      trendMetrics: this.calculateTrends(),
    };
  }

  private calculateTrends(): TrendMetric {
    if (this.snapshots.length < 2) {
      return {
        confidenceTrend: 'stable',
        errorTrend: 'stable',
        performanceTrend: 'stable',
        wisdomGrowthRate: 0,
        knowledgeAccumulationRate: 0,
        healthTrend: 'stable',
      };
    }

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    const recentConfidence = this.avgConfidence(recent);
    const olderConfidence = this.avgConfidence(older);

    const recentErrors = this.avgErrorRate(recent);
    const olderErrors = this.avgErrorRate(older);

    const recentHealth = this.avgHealth(recent);
    const olderHealth = this.avgHealth(older);

    return {
      confidenceTrend:
        recentConfidence > olderConfidence + 0.05
          ? 'rising'
          : recentConfidence < olderConfidence - 0.05
          ? 'falling'
          : 'stable',
      errorTrend:
        recentErrors > olderErrors + 0.02
          ? 'rising'
          : recentErrors < olderErrors - 0.02
          ? 'falling'
          : 'stable',
      performanceTrend: 'stable',
      wisdomGrowthRate: 0,
      knowledgeAccumulationRate: 0,
      healthTrend:
        recentHealth > olderHealth + 0.05
          ? 'rising'
          : recentHealth < olderHealth - 0.05
          ? 'falling'
          : 'stable',
    };
  }

  private avgConfidence(snapshots: MetricSnapshot[]): number {
    const values = snapshots.flatMap((s) =>
      Object.values(s.engineMetrics).map((m) => m.averageConfidence)
    );
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  }

  private avgErrorRate(snapshots: MetricSnapshot[]): number {
    const values = snapshots.flatMap((s) =>
      Object.values(s.engineMetrics).map((m) => m.errorRate)
    );
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  }

  private avgHealth(snapshots: MetricSnapshot[]): number {
    const values = snapshots.map((s) => s.systemMetrics.systemHealthScore);
    return values.reduce((a, b) => a + b, 0) / (values.length || 1);
  }

  private estimateMemoryUsage(): number {
    const snapshotSize = JSON.stringify(this.snapshots).length;
    const metricsSize = JSON.stringify(
      Object.fromEntries(this.engineMetrics)
    ).length;
    return snapshotSize + metricsSize;
  }

  getEngineHealth(engineName: string): number {
    return this.engineMetrics.get(engineName)?.healthScore ?? 1.0;
  }

  getSystemHealth(): number {
    const snapshot = this.takeSnapshot();
    return snapshot.systemMetrics.systemHealthScore;
  }

  getEngineMetric(engineName: string): EngineMetric | undefined {
    return this.engineMetrics.get(engineName);
  }

  getSnapshots(limit = 100): MetricSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  getAlerts(): string[] {
    const alerts: string[] = [];
    this.engineMetrics.forEach((metric, name) => {
      if (metric.healthScore < 0.3) {
        alerts.push(
          `CRITICAL: ${name} health at ${(metric.healthScore * 100).toFixed(0)}%`
        );
      } else if (metric.errorRate > 0.3) {
        alerts.push(
          `WARNING: ${name} error rate at ${(metric.errorRate * 100).toFixed(1)}%`
        );
      }
    });
    return alerts;
  }

  private emitEvent(type: CognitiveEventType, payload: any): void {
    if (this.eventBus) {
      this.eventBus.publish({
        type,
        payload,
        source: 'MetricsEngine',
        priority: EventPriority.LOW,
      });
    }
  }

  async process(input: any): Promise<MetricsReport> {
    const snapshot = this.takeSnapshot();
    return {
      snapshot,
      textReport: this.generateReport(),
      alerts: this.getAlerts(),
    };
  }

  generateReport(): string {
    const snapshot = this.takeSnapshot();
    const lines = [
      `═══════════════════════════════════════`,
      `     ASIS CSE — METRICS REPORT`,
      `═══════════════════════════════════════`,
      `Cycle:        ${snapshot.cycle}`,
      `System Health: ${(snapshot.systemMetrics.systemHealthScore * 100).toFixed(1)}%`,
      `Uptime:       ${(snapshot.systemMetrics.uptime / 1000).toFixed(0)}s`,
      `Executions:   ${snapshot.systemMetrics.totalEngineExecutions}`,
      `Errors:       ${snapshot.systemMetrics.totalErrors}`,
      `Contexts:     ${snapshot.systemMetrics.activeContexts}`,
      `Queue Depth:  ${snapshot.systemMetrics.eventQueueDepth}`,
      ``,
      `Trends:`,
      `  Confidence: ${snapshot.trendMetrics.confidenceTrend}`,
      `  Errors:     ${snapshot.trendMetrics.errorTrend}`,
      `  Health:     ${snapshot.trendMetrics.healthTrend}`,
      ``,
      `Engine Health:`,
    ];

    Object.entries(snapshot.engineMetrics).forEach(([name, metric]) => {
      const status =
        metric.healthScore > 0.8
          ? '✅'
          : metric.healthScore > 0.5
          ? '⚠️'
          : '❌';
      lines.push(
        `  ${status} ${name.padEnd(24)} health=${(metric.healthScore * 100).toFixed(0)}% ` +
          `execs=${metric.executionCount.toString().padStart(4)} ` +
          `avg=${metric.averageExecutionTime.toFixed(1)}ms ` +
          `err=${metric.errorCount}`
      );
    });

    const alerts = this.getAlerts();
    if (alerts.length > 0) {
      lines.push(``, `Alerts:`);
      alerts.forEach((a) => lines.push(`  • ${a}`));
    }

    lines.push(`═══════════════════════════════════════`);
    return lines.join('\n');
  }
}
