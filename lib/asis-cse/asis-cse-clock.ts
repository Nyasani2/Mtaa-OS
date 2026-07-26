/**
 * ASIS CSE — Cognitive Clock
 * Cycle timing, adaptive scheduling, burst handling
 * KAMOS-based load-responsive cadence management
 */

import {
  CognitiveEventBus,
  CognitiveEventType,
  EventPriority,
} from './asis-cse-event-system';
import { COUPLING } from './asis-cse-kamos';

export interface ClockConfig {
  baseCycleIntervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  adaptive: boolean;
  burstMode: boolean;
  maxBurstCycles: number;
  burstRecoveryRate: number;
  loadSmoothingFactor: number;
}

export interface CycleTiming {
  cycleNumber: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  scheduledNextAt: number;
  actualNextAt: number;
  latencyMs: number;
  loadFactor: number;
  intervalUsed: number;
}

export interface ClockReport {
  totalCycles: number;
  averageDuration: number;
  averageLatency: number;
  averageLoadFactor: number;
  burstRemaining: number;
  isRunning: boolean;
  currentInterval: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
}

export class CognitiveClock {
  private config: ClockConfig;
  private cycleNumber = 0;
  private timings: CycleTiming[] = [];
  private isRunning = false;
  private timeoutId?: any;
  private eventBus?: CognitiveEventBus;
  private burstRemaining = 0;
  private lastCycleStart = 0;
  private currentInterval: number;
  private loadHistory: number[] = [];

  constructor(config: Partial<ClockConfig> = {}, eventBus?: CognitiveEventBus) {
    this.config = {
      baseCycleIntervalMs: 100,
      minIntervalMs: 16,
      maxIntervalMs: 5000,
      adaptive: true,
      burstMode: false,
      maxBurstCycles: 5,
      burstRecoveryRate: 0.5,
      loadSmoothingFactor: 0.3,
      ...config,
    };
    this.eventBus = eventBus;
    this.burstRemaining = this.config.maxBurstCycles;
    this.currentInterval = this.config.baseCycleIntervalMs;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastCycleStart = Date.now();
    this.emitEvent(CognitiveEventType.CYCLE_START, {
      cycle: this.cycleNumber,
      timestamp: this.lastCycleStart,
    });
    this.scheduleNext();
  }

  stop(): void {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.emitEvent(CognitiveEventType.CYCLE_END, {
      cycle: this.cycleNumber,
      timestamp: Date.now(),
    });
  }

  pause(): void {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  resume(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNext();
  }

  tick(): void {
    const now = Date.now();
    const scheduledAt = this.lastCycleStart + this.currentInterval;
    const latencyMs = now - scheduledAt;

    const timing: CycleTiming = {
      cycleNumber: this.cycleNumber,
      startTime: now,
      scheduledNextAt: scheduledAt,
      actualNextAt: now,
      latencyMs,
      loadFactor: 0,
      intervalUsed: this.currentInterval,
    };

    this.lastCycleStart = now;
    this.cycleNumber++;

    this.emitEvent(CognitiveEventType.CLOCK_TICK, {
      cycle: this.cycleNumber,
      timing,
      interval: this.currentInterval,
    });

    if (this.timings.length > 0) {
      const recentDurations = this.timings.slice(-5).map((t) => t.durationMs || 0);
      const avgDuration = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
      const rawLoadFactor = Math.min(1, avgDuration / this.currentInterval);
      if (this.loadHistory.length > 0) {
        const lastLoad = this.loadHistory[this.loadHistory.length - 1];
        timing.loadFactor = lastLoad * (1 - this.config.loadSmoothingFactor) + rawLoadFactor * this.config.loadSmoothingFactor;
      } else {
        timing.loadFactor = rawLoadFactor;
      }
    }

    this.loadHistory.push(timing.loadFactor);
    if (this.loadHistory.length > 50) this.loadHistory.shift();

    this.timings.push(timing);
    if (this.timings.length > 200) this.timings.shift();

    if (this.isRunning) {
      const nextInterval = this.calculateNextInterval(timing);
      this.currentInterval = nextInterval;
      this.timeoutId = setTimeout(() => this.tick(), nextInterval);
    }
  }

  private scheduleNext(): void {
    this.timeoutId = setTimeout(() => this.tick(), this.currentInterval);
  }

  private calculateNextInterval(lastTiming: CycleTiming): number {
    let interval = this.config.baseCycleIntervalMs;
    if (this.config.adaptive) {
      const loadFactor = lastTiming.loadFactor;
      const adjustment = loadFactor * COUPLING;
      if (loadFactor > 0.85) {
        interval = interval * (1 + adjustment * 1.5);
        this.burstRemaining = Math.max(0, this.burstRemaining - 1);
      } else if (loadFactor > 0.6) {
        interval = interval * (1 + adjustment * 0.5);
        this.burstRemaining = Math.min(this.config.maxBurstCycles, this.burstRemaining + this.config.burstRecoveryRate * 0.5);
      } else if (loadFactor < 0.2 && this.burstRemaining >= 1) {
        if (this.config.burstMode) {
          interval = this.config.minIntervalMs;
          this.burstRemaining--;
        } else {
          interval = interval * (1 - adjustment * 0.3);
        }
      } else {
        this.burstRemaining = Math.min(this.config.maxBurstCycles, this.burstRemaining + this.config.burstRecoveryRate);
      }
    }
    return Math.max(this.config.minIntervalMs, Math.min(this.config.maxIntervalMs, Math.round(interval)));
  }

  endCycleTiming(): void {
    if (this.timings.length === 0) return;
    const current = this.timings[this.timings.length - 1];
    if (!current.endTime) {
      current.endTime = Date.now();
      current.durationMs = current.endTime - current.startTime;
    }
  }

  getCycleNumber(): number { return this.cycleNumber; }
  getCurrentInterval(): number { return this.currentInterval; }

  getAverageCycleDuration(): number {
    const durations = this.timings.filter((t) => t.durationMs !== undefined).map((t) => t.durationMs!);
    return durations.length === 0 ? 0 : durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  getAverageLatency(): number {
    return this.timings.length === 0 ? 0 : this.timings.reduce((sum, t) => sum + t.latencyMs, 0) / this.timings.length;
  }

  getAverageLoadFactor(): number {
    return this.loadHistory.length === 0 ? 0 : this.loadHistory.reduce((a, b) => a + b, 0) / this.loadHistory.length;
  }

  getBurstRemaining(): number { return Math.floor(this.burstRemaining); }
  isClockRunning(): boolean { return this.isRunning; }

  getReport(): ClockReport {
    const avgDuration = this.getAverageCycleDuration();
    const avgLatency = this.getAverageLatency();
    const avgLoad = this.getAverageLoadFactor();
    const recentIntervals = this.timings.slice(-10).map((t) => t.intervalUsed);
    const trend: ClockReport['trend'] =
      recentIntervals.length < 2
        ? 'stable'
        : recentIntervals[recentIntervals.length - 1] > recentIntervals[0]
        ? 'decelerating'
        : recentIntervals[recentIntervals.length - 1] < recentIntervals[0]
        ? 'accelerating'
        : 'stable';

    return {
      totalCycles: this.cycleNumber,
      averageDuration: avgDuration,
      averageLatency: avgLatency,
      averageLoadFactor: avgLoad,
      burstRemaining: Math.floor(this.burstRemaining),
      isRunning: this.isRunning,
      currentInterval: this.currentInterval,
      trend,
    };
  }

  getTimingReport(): string {
    const report = this.getReport();
    return [
      '═══════════════════════════════════════',
      '     ASIS CSE — COGNITIVE CLOCK',
      '═══════════════════════════════════════',
      `Total Cycles:      ${report.totalCycles}`,
      `Avg Duration:      ${report.averageDuration.toFixed(2)}ms`,
      `Avg Latency:       ${report.averageLatency.toFixed(2)}ms`,
      `Avg Load Factor:   ${(report.averageLoadFactor * 100).toFixed(1)}%`,
      `Current Interval:  ${report.currentInterval}ms`,
      `Burst Remaining:   ${report.burstRemaining}`,
      `Trend:             ${report.trend}`,
      `Running:           ${report.isRunning ? 'YES' : 'NO'}`,
      '═══════════════════════════════════════',
    ].join('\n');
  }

  private emitEvent(type: CognitiveEventType, payload: any): void {
    if (this.eventBus) {
      this.eventBus.publish({
        type,
        payload,
        source: 'CognitiveClock',
        priority: EventPriority.NORMAL,
      });
    }
  }
}
