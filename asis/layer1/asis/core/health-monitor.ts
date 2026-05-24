/**
 * ASIS Health Monitor
 * Self-monitoring and diagnostics for the ASIS subsystem
 */

import { ASISEventBus } from './event-bus';

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
}

export interface HealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  metrics: HealthMetric[];
  issues: string[];
  timestamp: number;
  uptime: number;
}

export class ASISHealthMonitor {
  private _eventBus: ASISEventBus;
  private _metrics: Map<string, HealthMetric> = new Map();
  private _issues: string[] = [];
  private _startTime: number = 0;
  private _checkInterval: any = null;
  private _initialized: boolean = false;

  constructor(eventBus: ASISEventBus) {
    this._eventBus = eventBus;
  }

  async initialize(): Promise<void> {
    this._startTime = Date.now();
    this._setupEventListeners();
    this._startMonitoring();
    this._initialized = true;
    console.log('[ASIS:HealthMonitor] Initialized');
  }

  async shutdown(): Promise<void> {
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
    }
    this._initialized = false;
    console.log('[ASIS:HealthMonitor] Shutdown');
  }

  private _setupEventListeners(): void {
    this._eventBus.on('asis:module:health', (event) => {
      this.recordMetric({
        name: `module_${event.payload.module}`,
        value: event.payload.health === 'healthy' ? 1 : 0,
        unit: 'status',
        threshold: 1,
        status: event.payload.health,
        timestamp: Date.now(),
      });
    });

    this._eventBus.on('asis:error', (event) => {
      this._issues.push(event.payload.message);
      if (this._issues.length > 100) {
        this._issues.shift();
      }
    });
  }

  private _startMonitoring(): void {
    this._checkInterval = setInterval(() => {
      this._runHealthCheck();
    }, 60000);
  }

  private _runHealthCheck(): void {
    const now = Date.now();
    const uptime = now - this._startTime;
    const memoryUsage = this._getMemoryUsage();
    const eventBusHealth = this._eventBus.isInitialized ? 1 : 0;

    this.recordMetric({
      name: 'memory_usage',
      value: memoryUsage,
      unit: 'MB',
      threshold: 512,
      status: memoryUsage > 512 ? 'warning' : 'healthy',
      timestamp: now,
    });

    this.recordMetric({
      name: 'event_bus',
      value: eventBusHealth,
      unit: 'status',
      threshold: 1,
      status: eventBusHealth === 1 ? 'healthy' : 'critical',
      timestamp: now,
    });

    this.recordMetric({
      name: 'uptime',
      value: uptime,
      unit: 'ms',
      threshold: Infinity,
      status: 'healthy',
      timestamp: now,
    });

    const report = this.getReport();
    this._eventBus.emit('asis:health:report', report);
  }

  private _getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  recordMetric(metric: HealthMetric): void {
    this._metrics.set(metric.name, metric);
  }

  getMetric(name: string): HealthMetric | undefined {
    return this._metrics.get(name);
  }

  getAllMetrics(): HealthMetric[] {
    return Array.from(this._metrics.values());
  }

  getReport(): HealthReport {
    const metrics = this.getAllMetrics();
    const criticalCount = metrics.filter((m) => m.status === 'critical').length;
    const warningCount = metrics.filter((m) => m.status === 'warning').length;

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalCount > 0) overall = 'critical';
    else if (warningCount > 2) overall = 'degraded';

    return {
      overall,
      metrics,
      issues: [...this._issues],
      timestamp: Date.now(),
      uptime: Date.now() - this._startTime,
    };
  }

  clearIssues(): void {
    this._issues = [];
  }
}
