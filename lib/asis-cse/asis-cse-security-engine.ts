// @ts-nocheck
/**
 * ASIS CSE — Security / Executive Engine (Engine 23)
 * Specification: 27_SECURITY_AND_TRUST.md + 24_EXECUTIVE_CORTEX.md
 * 
 * Zero-trust security enforcement + Executive Cortex coordination.
 * Protects cognition. Governs cognition. Coordinates all engines.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, SECURITY_CONFIDENCE_THRESHOLD, TRUST_DECAY_RATE } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface SecurityEngineState {
  trustRegistry: Map<string, number>;
  auditLog: any[];
  activePermissions: Map<string, string[]>;
  threatLevel: number;
  engineHealth: Map<string, any>;
  emergencyMode: boolean;
}

export class SecurityEngine implements CognitiveEngine {
  readonly id = 'security-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['zero-trust-enforcement', 'identity-validation', 'permission-auditing', 'threat-detection', 'emergency-override', 'engine-health-monitoring', 'cognitive-governance'];

  private state: SecurityEngineState;

  constructor() {
    this.state = {
      trustRegistry: new Map(),
      auditLog: [],
      activePermissions: new Map(),
      threatLevel: 0,
      engineHealth: new Map(),
      emergencyMode: false,
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const identity = context.inputs?.identity || {};
    const requestedAction = context.inputs?.requestedAction || {};
    const engineStatuses = context.inputs?.engineStatuses || [];
    const memoryAccess = context.inputs?.memoryAccess || {};
    const pluginRequests = context.inputs?.pluginRequests || [];

    // Validate identity
    const identityValidation = this.validateIdentity(identity);

    // Verify permissions for requested action
    const permissionCheck = this.verifyPermissions(identity, requestedAction);

    // Audit the request
    const auditEntry = this.auditRequest(identity, requestedAction, permissionCheck);

    // Monitor engine health
    const healthReport = this.monitorEngineHealth(engineStatuses);

    // Detect threats
    const threatAssessment = this.assessThreats(identity, requestedAction, memoryAccess, pluginRequests);

    // Check for emergency conditions
    const emergencyStatus = this.checkEmergencyConditions(threatAssessment, healthReport);

    // Enforce cognitive governance
    const governance = this.enforceGovernance(requestedAction, identity, permissionCheck);

    // Update trust scores
    this.updateTrustScores(identity, permissionCheck, threatAssessment);

    const securityOutput = {
      identityValidation,
      permissionCheck,
      auditEntry: { id: auditEntry.id, timestamp: auditEntry.timestamp },
      healthReport,
      threatAssessment,
      emergencyStatus,
      governance,
      trustScores: Object.fromEntries(this.state.trustRegistry),
      overallClearance: this.determineClearance(identityValidation, permissionCheck, threatAssessment, emergencyStatus),
    };

    const confidence = securityOutput.overallClearance.granted ? 0.95 : 0.1;

    return this.buildResult(
      [securityOutput],
      confidence,
      startTime,
      `Security evaluation for ${identity.userId || 'unknown'}: ${securityOutput.overallClearance.granted ? 'CLEARED' : 'DENIED'}. Threat level: ${(threatAssessment.level * 100).toFixed(0)}%. Emergency: ${emergencyStatus.active ? 'ACTIVE' : 'inactive'}.`
    );
  }

  private validateIdentity(identity: any): any {
    const requiredFields = ['userId', 'sessionId'];
    const present = requiredFields.filter((f: any) => identity[f]);
    const valid = present.length === requiredFields.length;

    // Check device trust
    const deviceTrust = identity.deviceId ? (this.state.trustRegistry.get(identity.deviceId) || 0.3) : 0.1;

    // Check user trust
    const userTrust = identity.userId ? (this.state.trustRegistry.get(identity.userId) || 0.5) : 0.1;

    // KAMOS-based trust emergence
    const combinedTrust = kamosMultiply(
      { value: deviceTrust, confidence: deviceTrust, timestamp: Date.now() },
      { value: userTrust, confidence: userTrust, timestamp: Date.now() },
      identity
    );

    return {
      valid,
      presentFields: present,
      missingFields: requiredFields.filter((f: any) => !identity[f]),
      deviceTrust,
      userTrust,
      combinedTrust: combinedTrust.value,
      authenticated: valid && combinedTrust.value > 0.2,
    };
  }

  private verifyPermissions(identity: any, action: any): any {
    const userId = identity.userId || 'anonymous';
    const userPermissions = this.state.activePermissions.get(userId) || ['observe'];
    const requiredPermissions = action.requiredPermissions || ['observe'];

    const granted = requiredPermissions.every((p: string) => 
      userPermissions.includes(p) || userPermissions.includes('admin')
    );

    const missing = requiredPermissions.filter((p: string) => 
      !userPermissions.includes(p) && !userPermissions.includes('admin')
    );

    return {
      granted,
      required: requiredPermissions,
      possessed: userPermissions,
      missing,
      escalationRequired: missing.some((p: string) => ['admin', 'architecture-administration'].includes(p)),
    };
  }

  private auditRequest(identity: any, action: any, permissionCheck: any): any {
    const entry = {
      id: uuidv4(),
      who: identity.userId || 'anonymous',
      what: action.type || 'unknown-action',
      when: Date.now(),
      why: action.purpose || 'unspecified',
      evidenceUsed: action.evidence || [],
      decisionMade: permissionCheck.granted ? 'permitted' : 'denied',
      confidence: permissionCheck.granted ? 0.9 : 0.1,
      outcome: permissionCheck.granted ? 'success' : 'blocked',
      metadata: {
        deviceId: identity.deviceId,
        sessionId: identity.sessionId,
        ipHash: identity.ipHash || 'unknown',
      },
    };

    this.state.auditLog.push(entry);

    // Keep last 1000 entries
    if (this.state.auditLog.length > 1000) {
      this.state.auditLog = this.state.auditLog.slice(-1000);
    }

    return entry;
  }

  private monitorEngineHealth(statuses: any[]): any {
    const healthReport: any = {
      engines: {},
      overallHealth: 1,
      degradedEngines: [],
      failedEngines: [],
    };

    for (const status of statuses) {
      const engineId = status.engineId || 'unknown';
      const latency = status.latency || 0;
      const accuracy = status.accuracy || 1;
      const failures = status.failures || 0;

      const healthScore = Math.max(0, 1 - (latency / 10000) * 0.3 - (1 - accuracy) * 0.5 - Math.min(failures / 10, 0.5));

      this.state.engineHealth.set(engineId, {
        healthScore,
        lastCheck: Date.now(),
        latency,
        accuracy,
        failures,
      });

      healthReport.engines[engineId] = healthScore;

      if (healthScore < 0.3) {
        healthReport.failedEngines.push(engineId);
      } else if (healthScore < 0.7) {
        healthReport.degradedEngines.push(engineId);
      }
    }

    const allScores = Object.values(healthReport.engines) as number[];
    healthReport.overallHealth = allScores.length > 0 
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
      : 1;

    return healthReport;
  }

  private assessThreats(identity: any, action: any, memoryAccess: any, pluginRequests: any[]): any {
    let threatScore = 0;
    const indicators = [];

    // Check for anomalous access patterns
    const userId = identity.userId || 'anonymous';
    const recentAccess = this.state.auditLog.filter((e: any) => e.who === userId && Date.now() - e.when < 60000);
    if (recentAccess.length > 20) {
      threatScore += 0.3;
      indicators.push('excessive-access-rate');
    }

    // Check for privilege escalation attempts
    if (action.requiredPermissions?.some((p: string) => ['admin', 'architecture-administration'].includes(p))) {
      const userTrust = this.state.trustRegistry.get(userId) || 0;
      if (userTrust < 0.7) {
        threatScore += 0.4;
        indicators.push('untrusted-privilege-escalation');
      }
    }

    // Check memory access patterns
    if (memoryAccess.sensitive && !memoryAccess.authorized) {
      threatScore += 0.3;
      indicators.push('unauthorized-sensitive-access');
    }

    // Check plugin requests
    for (const plugin of pluginRequests) {
      if (plugin.trustScore < 0.5) {
        threatScore += 0.2;
        indicators.push(`untrusted-plugin-${plugin.id}`);
      }
    }

    // Decay old threat indicators
    threatScore = Math.min(1, threatScore);
    this.state.threatLevel = threatScore;

    return {
      level: threatScore,
      indicators: [...new Set(indicators)],
      severity: threatScore > 0.7 ? 'critical' : threatScore > 0.4 ? 'elevated' : threatScore > 0.1 ? 'low' : 'none',
      recommendedAction: threatScore > 0.7 ? 'block-and-alert' : threatScore > 0.4 ? 'additional-verification' : 'proceed',
    };
  }

  private checkEmergencyConditions(threatAssessment: any, healthReport: any): any {
    const criticalThreat = threatAssessment.level > 0.8;
    const massFailure = healthReport.failedEngines.length > 3;
    const identityCompromise = threatAssessment.indicators.includes('identity-compromise');

    const emergencyActive = criticalThreat || massFailure || identityCompromise;

    if (emergencyActive && !this.state.emergencyMode) {
      this.state.emergencyMode = true;
    } else if (!emergencyActive && this.state.emergencyMode) {
      this.state.emergencyMode = false;
    }

    return {
      active: this.state.emergencyMode,
      triggeredBy: [
        ...(criticalThreat ? ['critical-threat'] : []),
        ...(massFailure ? ['mass-engine-failure'] : []),
        ...(identityCompromise ? ['identity-compromise'] : []),
      ],
      overrideCapabilities: this.state.emergencyMode ? ['suspend-all-engines', 'isolate-memory', 'alert-administrators'] : [],
      autoRecovery: !massFailure,
    };
  }

  private enforceGovernance(action: any, identity: any, permissionCheck: any): any {
    const governanceRules = [
      { rule: 'no-direct-engine-access', check: () => !action.bypassKernel },
      { rule: 'identity-mandatory', check: () => !!identity.userId },
      { rule: 'permission-verification', check: () => permissionCheck.granted },
      { rule: 'audit-trail-complete', check: () => this.state.auditLog.length > 0 },
      { rule: 'memory-access-justified', check: () => action.purpose?.length > 10 },
    ];

    const violations = governanceRules.filter((r: any) => !r.check());

    return {
      compliant: violations.length === 0,
      rulesChecked: governanceRules.length,
      violations: violations.map((v: any) => v.rule),
      enforcementAction: violations.length > 0 ? 'request-correction' : 'allow',
    };
  }

  private updateTrustScores(identity: any, permissionCheck: any, threatAssessment: any): void {
    const userId = identity.userId;
    if (!userId) return;

    const currentTrust = this.state.trustRegistry.get(userId) || 0.5;
    let delta = 0;

    if (permissionCheck.granted && threatAssessment.level < 0.2) {
      delta = 0.02; // Successful, low-threat interaction increases trust
    } else if (!permissionCheck.granted) {
      delta = -0.01; // Failed permission check slightly decreases trust
    } else if (threatAssessment.level > 0.5) {
      delta = -0.1; // High threat significantly decreases trust
    }

    // Apply decay
    const decayedTrust = currentTrust * (1 - TRUST_DECAY_RATE) + delta;
    this.state.trustRegistry.set(userId, Math.max(0, Math.min(1, decayedTrust)));

    // Device trust
    if (identity.deviceId) {
      const deviceTrust = this.state.trustRegistry.get(identity.deviceId) || 0.3;
      this.state.trustRegistry.set(identity.deviceId, Math.max(0, Math.min(1, deviceTrust * (1 - TRUST_DECAY_RATE) + delta * 0.5)));
    }
  }

  private determineClearance(identity: any, permissions: any, threats: any, emergency: any): any {
    if (emergency.active) {
      return { granted: false, reason: 'emergency-mode-active', emergencyOverride: false };
    }
    if (!identity.authenticated) {
      return { granted: false, reason: 'identity-not-authenticated', emergencyOverride: false };
    }
    if (!permissions.granted) {
      return { granted: false, reason: 'permissions-insufficient', emergencyOverride: permissions.escalationRequired };
    }
    if (threats.level > 0.7) {
      return { granted: false, reason: 'critical-threat-detected', emergencyOverride: false };
    }
    if (threats.level > 0.4) {
      return { granted: true, reason: 'cleared-with-monitoring', emergencyOverride: false, monitoring: true };
    }

    return { granted: true, reason: 'fully-cleared', emergencyOverride: false, monitoring: false };
  }

  private buildResult(outputs: any[], confidence: number, startTime: number, explanation: string): EngineResult {
    return {
      engineId: this.id,
      outputs,
      confidence: { overall: confidence, logical: confidence, evidence: confidence },
      processingTime: Date.now() - startTime,
      explanation,
      traceId: uuidv4(),
      timestamp: Date.now(),
    };
  }

  getAuditLog(): any[] {
    return this.state.auditLog;
  }

  getTrustRegistry(): Map<string, number> {
    return this.state.trustRegistry;
  }

  getEngineHealth(): Map<string, any> {
    return this.state.engineHealth;
  }

  isEmergencyMode(): boolean {
    return this.state.emergencyMode;
  }
}
