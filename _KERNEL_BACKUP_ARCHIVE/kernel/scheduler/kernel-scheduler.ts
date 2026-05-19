import { kernelOrchestrator } from "../orchestrator/kernel-orchestrator";
import { kernelLogEngine, kernelAutonomy } from "../core/kernel-services";

class KernelScheduler {
  private interval: any = null;
  private running = false;
  private baseInterval = 2000; // 2s default
  private currentInterval = this.baseInterval;
  private tickCount = 0;

  start() {
    if (this.running) return;

    this.running = true;

    kernelLogEngine.info("scheduler_start", {
      interval: this.currentInterval
    });

    this.loop();
  }

  private loop() {
    if (!this.running) return;

    this.interval = setTimeout(async () => {
      await this.tick();
      this.loop();
    }, this.currentInterval);
  }

  private async tick() {
    this.tickCount++;

    const result = await kernelOrchestrator.tick({
      type: "realtime",
      action: "heartbeat",
      riskScore: 0.1
    });

    kernelLogEngine.info("scheduler_tick", {
      tick: this.tickCount,
      status: result.status,
      route: result.route
    });

    this.adaptSpeed(result);
  }

  private adaptSpeed(result: any) {
    const health = result.autonomy?.health;

    // simple backpressure logic
    if (health?.cpu === "ok" && health?.memory === "ok") {
      this.currentInterval = Math.max(1000, this.currentInterval - 50);
    } else {
      this.currentInterval = Math.min(5000, this.currentInterval + 200);
    }
  }

  stop() {
    this.running = false;

    if (this.interval) {
      clearTimeout(this.interval);
    }

    kernelLogEngine.warn("scheduler_stop", {
      ticks: this.tickCount
    });
  }

  status() {
    return {
      running: this.running,
      interval: this.currentInterval,
      ticks: this.tickCount
    };
  }
}

export const kernelScheduler = new KernelScheduler();
