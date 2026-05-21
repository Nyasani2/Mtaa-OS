// lib/kernel/kernel-panic-handler.ts
import { kernel } from './kernel-init';
import { TelemetryService } from './services/telemetry.service';

export interface PanicInfo {
  type: 'crash' | 'unhandled_error' | 'module_failure' | 'network_failure' | 'auth_failure';
  message: string;
  stack?: string;
  module?: string;
  recoverable: boolean;
  timestamp: string;
}

export class KernelPanicHandler {
  private static panics: PanicInfo[] = [];
  private static isRecovering = false;

  static handlePanic(panic: PanicInfo) {
    console.error('[KERNEL PANIC]', panic.type, panic.message);
    this.panics.push(panic);

    // Log to telemetry
    TelemetryService.track({
      event_type: 'crash',
      event_name: `kernel_panic_${panic.type}`,
      properties: panic,
    });

    if (panic.recoverable && !this.isRecovering) {
      this.attemptRecovery(panic);
    } else {
      this.enterSafeMode(panic);
    }
  }

  private static async attemptRecovery(panic: PanicInfo) {
    this.isRecovering = true;
    console.log('[Kernel] Attempting recovery...');

    try {
      if (panic.module) {
        // Re-initialize specific module
        const module = kernel.getState().modules.get(panic.module);
        if (module) {
          await module.init();
          const healthy = await module.healthCheck();
          if (healthy) {
            console.log(`[Kernel] Module ${panic.module} recovered`);
            this.isRecovering = false;
            return;
          }
        }
      }

      // Full re-boot attempt
      await kernel.boot();
      this.isRecovering = false;
    } catch (err: any) {
      console.error('[Kernel] Recovery failed:', err);
      this.enterSafeMode(panic);
    }
  }

  private static enterSafeMode(panic: PanicInfo) {
    kernel.enterSafeMode();
    console.warn('[Kernel] Entered safe mode due to:', panic.message);

    TelemetryService.track({
      event_type: 'error',
      event_name: 'kernel_safe_mode',
      properties: { panic, total_panics: this.panics.length },
    });
  }

  static getPanics(): Readonly<PanicInfo[]> {
    return [...this.panics];
  }

  static clearPanics() {
    this.panics = [];
  }

  static setupGlobalHandlers() {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason: any) => {
        this.handlePanic({
          type: 'unhandled_error',
          message: reason?.message || String(reason),
          stack: reason?.stack,
          recoverable: true,
          timestamp: new Date().toISOString(),
        });
      });

      process.on('uncaughtException', (error: Error) => {
        this.handlePanic({
          type: 'crash',
          message: error.message,
          stack: error.stack,
          recoverable: false,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }
}
