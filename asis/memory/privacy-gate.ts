/**
 * ASIS Layer 4 — Privacy Gate
 * Context scope enforcement with consent validation
 * All data access flows through here
 */

import { ContextScope, MemoryLayer } from '../types/memory.types';
import {
  ConsentStatus,
  ConsentRecord,
  PrivacySettings,
  DataExportRequest,
  DataDeletionRequest,
  ExportFormat,
  AuditLogEntry,
} from '../types/privacy.types';
import { EventBus } from '../kernel/event-bus';

export class PrivacyGate {
  private userId: string;
  private consents: Map<string, ConsentRecord> = new Map();
  private settings: PrivacySettings;
  private auditLog: AuditLogEntry[] = [];
  private eventBus: EventBus;

  constructor(userId: string, eventBus?: EventBus) {
    this.userId = userId;
    this.eventBus = eventBus || new EventBus();
    this.settings = this.loadSettings();
    this.loadConsents();
  }

  /**
   * Check if storage is allowed for given layer and scope
   */
  async canStore(layer: MemoryLayer, scope: ContextScope): Promise<boolean> {
    // Security layer always allowed (system audit)
    if (layer === MemoryLayer.SECURITY) return true;

    // Check privacy settings
    if (!this.settings.allowBehaviorTracking && layer === MemoryLayer.SHORT_TERM) {
      return false;
    }
    if (!this.settings.allowSemanticMemory && layer === MemoryLayer.SEMANTIC) {
      return false;
    }
    if (!this.settings.allowPreferenceLearning && layer === MemoryLayer.PREFERENCE) {
      return false;
    }

    // Check consent for scope
    const consent = this.getConsent(scope);
    if (!consent || consent.status !== ConsentStatus.GRANTED) {
      return false;
    }

    return true;
  }

  /**
   * Get allowed scopes for current user
   */
  async getAllowedScopes(): Promise<ContextScope[]> {
    const allScopes = Object.values(ContextScope);
    const allowed: ContextScope[] = [ContextScope.GLOBAL];

    for (const scope of allScopes) {
      if (scope === ContextScope.GLOBAL) continue;
      const consent = this.getConsent(scope);
      if (consent && consent.status === ConsentStatus.GRANTED) {
        allowed.push(scope);
      }
    }

    return allowed;
  }

  /**
   * Request consent for a scope
   */
  async requestConsent(
    scope: ContextScope,
    purpose: string,
    dataTypes: string[],
    agentTypes: string[],
    retentionDays: number = 365
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `consent_${Date.now()}`,
      userId: this.userId,
      scope: scope.toString(),
      purpose,
      status: ConsentStatus.PENDING,
      dataTypes,
      agentTypes,
      retentionDays,
      version: '1.0',
    };

    this.consents.set(scope, record);
    this.saveConsents();

    // Emit for UI to show consent dialog
    this.eventBus.emit('privacy:consent_requested', record);

    return record;
  }

  /**
   * Grant consent
   */
  async grantConsent(consentId: string, expiresAt?: Date): Promise<ConsentRecord> {
    for (const [scope, record] of this.consents) {
      if (record.id === consentId) {
        record.status = ConsentStatus.GRANTED;
        record.grantedAt = new Date();
        record.expiresAt = expiresAt || new Date(Date.now() + record.retentionDays * 86400000);
        this.saveConsents();

        this.audit('consent_granted', scope, { consentId });
        this.eventBus.emit('privacy:consent_granted', record);

        return record;
      }
    }
    throw new Error(`Consent ${consentId} not found`);
  }

  /**
   * Revoke consent
   */
  async revokeConsent(consentId: string): Promise<ConsentRecord> {
    for (const [scope, record] of this.consents) {
      if (record.id === consentId) {
        record.status = ConsentStatus.REVOKED;
        record.revokedAt = new Date();
        this.saveConsents();

        this.audit('consent_revoked', scope, { consentId });
        this.eventBus.emit('privacy:consent_revoked', record);

        return record;
      }
    }
    throw new Error(`Consent ${consentId} not found`);
  }

  /**
   * Create data export request
   */
  async requestExport(formats: ExportFormat[], scopes?: string[]): Promise<DataExportRequest> {
    const request: DataExportRequest = {
      id: `export_${Date.now()}`,
      userId: this.userId,
      requestedAt: new Date(),
      status: 'pending',
      formats,
      scopes: scopes || this.getAllScopes(),
    };

    this.audit('export_requested', 'global', { exportId: request.id, formats });
    this.eventBus.emit('privacy:export_requested', request);

    return request;
  }

  /**
   * Create data deletion request
   */
  async requestDeletion(scopes: string[], deleteType: 'soft' | 'hard' | 'anonymize' = 'soft'): Promise<DataDeletionRequest> {
    const request: DataDeletionRequest = {
      id: `delete_${Date.now()}`,
      userId: this.userId,
      requestedAt: new Date(),
      status: 'pending',
      scopes,
      deleteType,
    };

    this.audit('deletion_requested', 'global', { deleteId: request.id, scopes, deleteType });
    this.eventBus.emit('privacy:deletion_requested', request);

    return request;
  }

  /**
   * Get privacy settings
   */
  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  /**
   * Update privacy settings
   */
  async updateSettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    this.settings = { ...this.settings, ...settings, lastUpdated: new Date() };
    this.saveSettings();

    this.audit('settings_updated', 'global', { settings });
    this.eventBus.emit('privacy:settings_updated', this.settings);

    return this.settings;
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  private getConsent(scope: ContextScope): ConsentRecord | undefined {
    return this.consents.get(scope);
  }

  private getAllScopes(): string[] {
    return Object.values(ContextScope).map(s => s.toString());
  }

  private audit(action: string, scope: string, details?: Record<string, unknown>): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      userId: this.userId,
      action,
      scope,
      success: true,
      details: details ? JSON.stringify(details) : undefined,
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  private loadSettings(): PrivacySettings {
    // Load from localStorage or return defaults
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`asis_privacy_${this.userId}`);
      if (saved) return JSON.parse(saved);
    }

    return {
      userId: this.userId,
      autoDeleteDays: 365,
      allowBehaviorTracking: true,
      allowSemanticMemory: true,
      allowPreferenceLearning: true,
      allowCrossDomainInference: false,
      minimumConsentLevel: ConsentStatus.GRANTED,
      exportEncryption: true,
      lastUpdated: new Date(),
    };
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`asis_privacy_${this.userId}`, JSON.stringify(this.settings));
    }
  }

  private loadConsents(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`asis_consents_${this.userId}`);
      if (saved) {
        const data = JSON.parse(saved);
        for (const [scope, record] of Object.entries(data)) {
          this.consents.set(scope as ContextScope, record as ConsentRecord);
        }
      }
    }
  }

  private saveConsents(): void {
    if (typeof window !== 'undefined') {
      const data: Record<string, ConsentRecord> = {};
      for (const [scope, record] of this.consents) {
        data[scope] = record;
      }
      localStorage.setItem(`asis_consents_${this.userId}`, JSON.stringify(data));
    }
  }
}
