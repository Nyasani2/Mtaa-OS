// lib/mtaa/kernel/memory-watchdog.ts
export interface MemorySnapshot { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number; timestamp: number; }

class MemoryWatchdog {
  private interval: ReturnType<typeof setInterval>|null = null;
  private readonly CHECK_INTERVAL_MS = 10000;
  private readonly WARNING_THRESHOLD = 0.75;
  private readonly CRITICAL_THRESHOLD = 0.90;
  private history: MemorySnapshot[] = []; private readonly MAX_HISTORY = 20;

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.check(), this.CHECK_INTERVAL_MS);
    console.log('[WATCHDOG] Memory monitoring started');
  }
  stop(): void { if (this.interval) { clearInterval(this.interval); this.interval = null; } }

  private check(): void {
    const perf = (globalThis as any).performance;
    if (!perf || !perf.memory) return;
    const snapshot: MemorySnapshot = {
      usedJSHeapSize: perf.memory.usedJSHeapSize, totalJSHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit, timestamp: Date.now(),
    };
    this.history.push(snapshot);
    if (this.history.length > this.MAX_HISTORY) this.history.shift();
    const ratio = snapshot.usedJSHeapSize / snapshot.jsHeapSizeLimit;
    if (ratio > this.CRITICAL_THRESHOLD) { console.error(`[WATCHDOG] CRITICAL: ${(ratio*100).toFixed(1)}% memory used`); this.triggerCleanup(); }
    else if (ratio > this.WARNING_THRESHOLD) console.warn(`[WATCHDOG] WARNING: ${(ratio*100).toFixed(1)}% memory used`);
  }

  private triggerCleanup(): void { console.log('[WATCHDOG] Triggering memory cleanup'); }
  getHistory(): MemorySnapshot[] { return [...this.history]; }
}
export const memoryWatchdog = new MemoryWatchdog();
