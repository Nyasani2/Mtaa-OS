/**
 * MTAA OS — Kernel Watchdog
 * Detects dead services, restarts failed modules, isolates crashes.
 */

import { KernelEventSystem } from '../events/kernel-event-system';

export interface WatchdogService {
  id: string;
  name: string;
  domain: string;
  healthCheck: () => Promise<boolean>;
  restart: () => Promise<void>;
  maxRestarts: number;
  checkIntervalMs: number;
}

export class KernelWatchdog {
  private eventSystem: KernelEventSystem;
  private services: Map<string, WatchdogService> = new Map();
  private healthHistory: Map<string, boolean[]> = new Map();
  private restartCounts: Map<string, number> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private isActive = false;

  constructor(eventSystem: KernelEventSystem) {
    this.eventSystem = eventSystem;
  }

  activate(): void {
    this.isActive = true;
    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.watchdog.activated',
      payload: {},
      priority: 'normal',
      sourceModule: 'kernel.watchdog',
    });
  }

  deactivate(): void {
    this.isActive = false;
    this.timers.forEach((t) => clearInterval(t));
    this.timers.clear();
  }

  register(service: WatchdogService): void {
    this.services.set(service.id, service);
    this.healthHistory.set(service.id, []);
    this.restartCounts.set(service.id, 0);

    const timer = setInterval(async () => {
      await this._checkHealth(service);
    }, service.checkIntervalMs);

    this.timers.set(service.id, timer);
  }

  unregister(serviceId: string): void {
    const timer = this.timers.get(serviceId);
    if (timer) clearInterval(timer);
    this.timers.delete(serviceId);
    this.services.delete(serviceId);
    this.healthHistory.delete(serviceId);
    this.restartCounts.delete(serviceId);
  }

  getStatus(): { id: string; healthy: boolean; restarts: number; lastCheck: number }[] {
    return Array.from(this.services.values()).map((s) => {
      const history = this.healthHistory.get(s.id) || [];
      const last = history[history.length - 1];
      return {
        id: s.id,
        healthy: last ?? true,
        restarts: this.restartCounts.get(s.id) || 0,
        lastCheck: Date.now(),
      };
    });
  }

  private async _checkHealth(service: WatchdogService): Promise<void> {
    try {
      const healthy = await service.healthCheck();
      const history = this.healthHistory.get(service.id)!;
      history.push(healthy);
      if (history.length > 10) history.shift();

      if (!healthy) {
        const restarts = (this.restartCounts.get(service.id) || 0) + 1;
        this.restartCounts.set(service.id, restarts);

        if (restarts <= service.maxRestarts) {
          this.eventSystem.publish({
            domain: 'kernel',
            type: 'kernel.watchdog.service_unhealthy',
            payload: { serviceId: service.id, name: service.name, restarts },
            priority: 'high',
            sourceModule: 'kernel.watchdog',
          });

          try {
            await service.restart();
            this.eventSystem.publish({
              domain: 'kernel',
              type: 'kernel.watchdog.service_restarted',
              payload: { serviceId: service.id, name: service.name, attempt: restarts },
              priority: 'high',
              sourceModule: 'kernel.watchdog',
            });
          } catch (err) {
            this.eventSystem.publish({
              domain: 'kernel',
              type: 'kernel.watchdog.restart_failed',
              payload: { serviceId: service.id, name: service.name, error: String(err) },
              priority: 'critical',
              sourceModule: 'kernel.watchdog',
            });
          }
        } else {
          this.eventSystem.publish({
            domain: 'kernel',
            type: 'kernel.watchdog.service_isolated',
            payload: { serviceId: service.id, name: service.name, reason: 'max_restarts_exceeded' },
            priority: 'critical',
            sourceModule: 'kernel.watchdog',
          });
          this.unregister(service.id);
        }
      }
    } catch (err) {
      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.watchdog.check_error',
        payload: { serviceId: service.id, error: String(err) },
        priority: 'critical',
        sourceModule: 'kernel.watchdog',
      });
    }
  }
}

export default KernelWatchdog;
