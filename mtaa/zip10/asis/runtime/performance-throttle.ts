// ============================================================
// PERFORMANCE THROTTLE — CPU, memory, rate limiting, adaptive slowdown
// Low-end device mode, emergency performance mode
// ============================================================

import { IPerformanceThrottle } from './interfaces';
import { ThrottleState, ThrottleLevel, RuntimeConfig } from './types';

export class PerformanceThrottle implements IPerformanceThrottle {
  private state: ThrottleState;
  private config: RuntimeConfig;
  private history: ThrottleState[] = [];
  private readonly MAX_HISTORY = 60; // last 60 readings

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.state = {
      level: 'normal',
      cpuLoad: 0,
      memoryUsageMB: 0,
      activeExecutions: 0,
      queueDepth: 0,
      requestRate: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  updateMetrics(metrics: { cpu: number; memory: number; active: number; queue: number; rate: number }): void {
    this.state = {
      level: this.calculateThrottleLevel(metrics),
      cpuLoad: metrics.cpu,
      memoryUsageMB: metrics.memory,
      activeExecutions: metrics.active,
      queueDepth: metrics.queue,
      requestRate: metrics.rate,
      lastUpdated: new Date().toISOString(),
    };

    this.history.push({ ...this.state });
    if (this.history.length > this.MAX_HISTORY) this.history.shift();

    // Log level changes
    const prev = this.history[this.history.length - 2];
    if (prev && prev.level !== this.state.level) {
      console.log(`[PerformanceThrottle] Level changed: ${prev.level} → ${this.state.level}`);
    }
  }

  getThrottleLevel(): ThrottleLevel {
    return this.state.level;
  }

  shouldThrottle(): boolean {
    return this.state.level !== 'normal';
  }

  getAdaptiveConfig(): Partial<RuntimeConfig> {
    switch (this.state.level) {
      case 'emergency':
        return {
          maxConcurrentExecutions: 1,
          defaultTimeoutMs: 10000,
          retryAttempts: 1,
          requestRateLimit: 5,
        };
      case 'minimal':
        return {
          maxConcurrentExecutions: Math.max(1, Math.floor(this.config.maxConcurrentExecutions / 4)),
          defaultTimeoutMs: this.config.defaultTimeoutMs * 2,
          retryAttempts: 1,
          requestRateLimit: Math.max(10, Math.floor(this.config.requestRateLimit / 3)),
        };
      case 'reduced':
        return {
          maxConcurrentExecutions: Math.max(1, Math.floor(this.config.maxConcurrentExecutions / 2)),
          defaultTimeoutMs: Math.floor(this.config.defaultTimeoutMs * 1.5),
          retryAttempts: Math.max(1, this.config.retryAttempts - 1),
          requestRateLimit: Math.floor(this.config.requestRateLimit / 2),
        };
      default:
        return {};
    }
  }

  getState(): ThrottleState {
    return { ...this.state };
  }

  getTrend(): { improving: boolean; stable: boolean; degrading: boolean } {
    if (this.history.length < 10) {
      return { improving: false, stable: true, degrading: false };
    }

    const recent = this.history.slice(-10);
    const avgCpu = recent.reduce((s, h) => s + h.cpuLoad, 0) / recent.length;
    const avgMem = recent.reduce((s, h) => s + h.memoryUsageMB, 0) / recent.length;
    const prevAvgCpu = this.history.slice(-20, -10).reduce((s, h) => s + h.cpuLoad, 0) / 10;
    const prevAvgMem = this.history.slice(-20, -10).reduce((s, h) => s + h.memoryUsageMB, 0) / 10;

    const cpuDiff = avgCpu - prevAvgCpu;
    const memDiff = avgMem - prevAvgMem;

    return {
      improving: cpuDiff < -10 && memDiff < -50,
      stable: Math.abs(cpuDiff) < 5 && Math.abs(memDiff) < 25,
      degrading: cpuDiff > 10 || memDiff > 50,
    };
  }

  private calculateThrottleLevel(metrics: { cpu: number; memory: number; active: number; queue: number; rate: number }): ThrottleLevel {
    // Emergency: critical resource exhaustion
    if (metrics.memory > this.config.memoryThresholdMB * 1.5 || metrics.cpu > this.config.cpuThresholdPercent * 1.5) {
      return 'emergency';
    }

    // Minimal: severe pressure
    if (metrics.memory > this.config.memoryThresholdMB || metrics.cpu > this.config.cpuThresholdPercent || metrics.queue > 50) {
      return 'minimal';
    }

    // Reduced: moderate pressure
    if (metrics.memory > this.config.memoryThresholdMB * 0.7 || metrics.cpu > this.config.cpuThresholdPercent * 0.7 || metrics.queue > 20) {
      return 'reduced';
    }

    // Normal
    return 'normal';
  }
}
