// lib/mtaa/kernel/panic-handler.ts
import { router } from 'expo-router';

export interface PanicContext { error: Error; phase: string; service?: string; timestamp: string; recoverable: boolean; }

class PanicHandler {
  private panicCount = 0; private readonly MAX_PANICS = 3; private readonly PANIC_WINDOW_MS = 30000; private lastPanicTime = 0;

  handle(context: PanicContext): void {
    console.error(`[PANIC] ${context.phase}${context.service ? `/${context.service}` : ''}: ${context.error.message}`);
    this.panicCount++; const now = Date.now();
    if (now - this.lastPanicTime > this.PANIC_WINDOW_MS) this.panicCount = 1;
    this.lastPanicTime = now;
    if (this.panicCount >= this.MAX_PANICS) { this.enterSafeMode(); return; }
    if (context.recoverable) this.attemptRecovery(context); else this.enterSafeMode();
  }

  private attemptRecovery(context: PanicContext): void { console.log('[PANIC] Attempting recovery...'); }
  private enterSafeMode(): void {
    console.error('[PANIC] Entering safe mode');
    try { router.replace('/(os)/safe-mode'); } catch { console.error('[PANIC] Safe mode navigation failed'); }
  }
  reset(): void { this.panicCount = 0; this.lastPanicTime = 0; }
}
export const panicHandler = new PanicHandler();
