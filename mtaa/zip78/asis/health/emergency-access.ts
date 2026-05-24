import { IEmergencyAccess } from './interfaces';
import { EmergencyAccessLog } from './types';
import { ConsentManager } from './consent-manager';
import { HealthAuditLog } from './audit-log';

export class EmergencyAccess implements IEmergencyAccess {
  private logs: Map<string, EmergencyAccessLog> = new Map();
  private contacts: Map<string, string[]> = new Map();
  private active: Map<string, string> = new Map();
  constructor(private consent: ConsentManager, private audit: HealthAuditLog) {}

  async activate(userId: string, triggeredBy: string, reason: string): Promise<EmergencyAccessLog> {
    const trusted = this.contacts.get(userId) || [];
    if (!trusted.includes(triggeredBy) && triggeredBy !== 'self') throw new Error('Unauthorized trigger');
    const log: EmergencyAccessLog = { id: `em_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, triggeredBy, reason, accessLevel: 'emergency_read', status: 'active', createdAt: new Date().toISOString(), trustedContactIds: trusted, recordsAccessed: [] };
    this.logs.set(log.id, log); this.active.set(userId, log.id);
    await this.consent.createEmergencyOverride(userId, reason);
    await this.audit.log({ userId, actorId: triggeredBy, actorType: triggeredBy === 'self' ? 'user' : 'system', action: 'EMERGENCY_ACTIVATED', result: 'success', details: `Emergency: ${reason}` });
    return log;
  }

  async resolve(userId: string, logId: string): Promise<EmergencyAccessLog> {
    const log = this.logs.get(logId); if (!log || log.userId !== userId) throw new Error('Log not found');
    const resolved: EmergencyAccessLog = { ...log, status: 'resolved', resolvedAt: new Date().toISOString() };
    this.logs.set(logId, resolved); this.active.delete(userId);
    const consents = await this.consent.listActiveConsents(userId);
    for (const c of consents) { if (c.status === 'emergency_override') await this.consent.revokeConsent(userId, c.id); }
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'EMERGENCY_RESOLVED', result: 'success', details: `Resolved. Accessed: ${log.recordsAccessed.length}` });
    return resolved;
  }

  async getTrustedContacts(userId: string): Promise<string[]> { return this.contacts.get(userId) || []; }
  async setTrustedContacts(userId: string, contactIds: string[]): Promise<void> {
    this.contacts.set(userId, contactIds);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'TRUSTED_CONTACTS_UPDATED', result: 'success', details: `${contactIds.length} contacts` });
  }
  async isEmergencyActive(userId: string): Promise<boolean> { return this.active.has(userId); }
}
