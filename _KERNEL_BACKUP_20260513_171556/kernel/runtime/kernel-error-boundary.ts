/**
 * MTAA OS — Kernel Error Boundary
 * Global error gate. Kernel must survive module failures.
 */

import { KernelEventSystem } from '../events/kernel-event-system';

export interface ErrorContext {
  module: string;
  domain: string;
  phase: string;
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  timestamp: number;
  stack?: string;
  handled: boolean;
}

export class KernelErrorBoundary {
  private eventSystem: KernelEventSystem;
  private isActive = false;
  private reports: ErrorReport[] = [];
  private originalOnError: OnErrorEventHandler | null = null;
  private originalUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(eventSystem: KernelEventSystem) {
    this.eventSystem = eventSystem;
  }

  activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Capture global errors
    this.originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.capture(error || new Error(String(message)), {
        module: source || 'window',
        domain: 'kernel',
        phase: 'runtime',
        recoverable: false,
        retryCount: 0,
        maxRetries: 0,
      });
      return true; // prevent default
    };

    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      this.capture(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          module: 'promise',
          domain: 'kernel',
          phase: 'unhandled_rejection',
          recoverable: false,
          retryCount: 0,
          maxRetries: 0,
        }
      );
      event.preventDefault();
    };

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.error_boundary.activated',
      payload: {},
      priority: 'normal',
      sourceModule: 'kernel.error_boundary',
    });
  }

  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.originalOnError) window.onerror = this.originalOnError;
    if (this.originalUnhandledRejection) window.onunhandledrejection = this.originalUnhandledRejection;
  }

  capture(error: Error, context: ErrorContext): ErrorReport {
    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      error,
      context,
      timestamp: Date.now(),
      stack: error.stack,
      handled: false,
    };

    this.reports.push(report);

    // Attempt recovery if recoverable
    if (context.recoverable && context.retryCount < context.maxRetries) {
      this._attemptRecovery(report);
    } else {
      this._escalate(report);
    }

    return report;
  }

  getReports(): ErrorReport[] {
    return [...this.reports];
  }

  getRecentErrors(limit = 50): ErrorReport[] {
    return this.reports.slice(-limit);
  }

  private _attemptRecovery(report: ErrorReport): void {
    report.context.retryCount++;
    report.handled = true;

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.error_boundary.recovery_attempt',
      payload: {
        reportId: report.id,
        module: report.context.module,
        attempt: report.context.retryCount,
      },
      priority: 'high',
      sourceModule: 'kernel.error_boundary',
    });
  }

  private _escalate(report: ErrorReport): void {
    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.error_boundary.fatal',
      payload: {
        reportId: report.id,
        module: report.context.module,
        error: report.error.message,
        stack: report.stack,
      },
      priority: 'critical',
      sourceModule: 'kernel.error_boundary',
    });
  }
}

export default KernelErrorBoundary;
