/**
 * MTAA OS — Architecture Guard
 * Runtime enforcement against cross-domain violations.
 *
 * FORBIDDEN:
 *   - domains importing each other directly
 *   - app layer calling kernel internals
 *   - hooks bypassing services
 */

import { KernelEventSystem } from './events/kernel-event-system';

export interface GuardRule {
  id: string;
  fromPattern: RegExp;
  toPattern: RegExp;
  allowed: boolean;
  description: string;
}

export interface GuardViolation {
  ruleId: string;
  from: string;
  to: string;
  timestamp: number;
  stack?: string;
}

export class ArchitectureGuard {
  private eventSystem: KernelEventSystem;
  private rules: GuardRule[] = [];
  private violations: GuardViolation[] = [];
  private isActive = false;

  constructor(eventSystem: KernelEventSystem) {
    this.eventSystem = eventSystem;
    this._loadDefaultRules();
  }

  activate(): void {
    this.isActive = true;

    // Monkey-patch dynamic import to intercept violations
    const originalImport = window?.import || (() => {});
    // Note: actual runtime interception requires build-time or loader hooks
    // This is the runtime reporting layer

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.guard.activated',
      payload: { ruleCount: this.rules.length },
      priority: 'normal',
      sourceModule: 'kernel.guard',
    });
  }

  addRule(rule: GuardRule): void {
    this.rules.push(rule);
  }

  check(fromPath: string, toPath: string): boolean {
    if (!this.isActive) return true;

    for (const rule of this.rules) {
      if (rule.fromPattern.test(fromPath) && rule.toPattern.test(toPath)) {
        if (!rule.allowed) {
          this._recordViolation(rule.id, fromPath, toPath);
          return false;
        }
        return true;
      }
    }

    return true; // default allow
  }

  getViolations(): GuardViolation[] {
    return [...this.violations];
  }

  getRules(): GuardRule[] {
    return [...this.rules];
  }

  private _loadDefaultRules(): void {
    // Rule 1: No direct domain-to-domain imports
    this.rules.push({
      id: 'guard.domain-cross-import',
      fromPattern: /\/domains\/([^/]+)\//,
      toPattern: /\/domains\/([^/]+)\//,
      allowed: false,
      description: 'Domains may not import each other directly. Use kernel event system.',
    });

    // Rule 2: App layer cannot call kernel internals
    this.rules.push({
      id: 'guard.app-kernel-bypass',
      fromPattern: /\/app\//,
      toPattern: /\/lib\/kernel\/(events|runtime|registry)\//,
      allowed: false,
      description: 'App layer must use public kernel APIs, not internal modules.',
    });

    // Rule 3: Hooks must not bypass services
    this.rules.push({
      id: 'guard.hook-service-bypass',
      fromPattern: /\/hooks\//,
      toPattern: /\/domains\/[^/]+\/(?!services)/,
      allowed: false,
      description: 'Hooks must call domain services, not bypass to controllers/state.',
    });

    // Rule 4: Allow kernel to access everything
    this.rules.push({
      id: 'guard.kernel-omni',
      fromPattern: /\/lib\/kernel\//,
      toPattern: /.*/,
      allowed: true,
      description: 'Kernel may access any module.',
    });

    // Rule 5: Allow civic core to bridge civic modules
    this.rules.push({
      id: 'guard.civic-core-bridge',
      fromPattern: /\/domains\/civic\/core\//,
      toPattern: /\/domains\/civic\/[^/]+\//,
      allowed: true,
      description: 'Civic core interoperability layer may bridge civic modules.',
    });
  }

  private _recordViolation(ruleId: string, from: string, to: string): void {
    const violation: GuardViolation = {
      ruleId,
      from,
      to,
      timestamp: Date.now(),
    };
    this.violations.push(violation);

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.guard.violation',
      payload: violation,
      priority: 'critical',
      sourceModule: 'kernel.guard',
    });
  }
}

export default ArchitectureGuard;
