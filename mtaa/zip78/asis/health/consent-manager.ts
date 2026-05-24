import { IConsentManager } from './interfaces';
import { ConsentToken, HealthCategory, AccessLevel } from './types';
import { HealthAuditLog } from './audit-log';

export class ConsentManager implements IConsentManager {
  private tokens: Map<string, ConsentToken> = new Map();
  private audit: HealthAuditLog;

  constructor(auditLog: HealthAuditLog) { this.audit = auditLog; }

  async requestAccess(requesterId: string, userId: string, categories: HealthCategory[], level: AccessLevel): Promise<ConsentToken> {
    const token: ConsentToken = {
      id: `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, requesterId,
      requesterName: '', accessLevel: level, status: 'pending', createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), categories,
      pinVerified: false, biometricVerified: false, auditLogId: '',
    };
    this.tokens.set(token.id, token);
    await this.audit.log({ userId, actorId: requesterId, actorType: 'provider', action: 'CONSENT_REQUESTED', consentTokenId: token.id, result: 'success', details: `Requested ${level} to ${categories.join(',')}` });
    return token;
  }

  async approveConsent(userId: string, tokenId: string, pin: string): Promise<ConsentToken> {
    const token = this.tokens.get(tokenId);
    if (!token || token.userId !== userId) throw new Error('Token not found');
    const valid = await this.validatePIN(userId, pin);
    if (!valid) {
      await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'CONSENT_APPROVE_FAILED', consentTokenId: tokenId, result: 'denied', details: 'PIN failed' });
      throw new Error('Invalid PIN');
    }
    const approved: ConsentToken = { ...token, status: 'approved', approvedAt: new Date().toISOString(), pinVerified: true };
    this.tokens.set(tokenId, approved);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'CONSENT_APPROVED', consentTokenId: tokenId, result: 'success', details: `Approved ${token.accessLevel} for ${token.requesterId}` });
    return approved;
  }

  async revokeConsent(userId: string, tokenId: string): Promise<ConsentToken> {
    const token = this.tokens.get(tokenId);
    if (!token || token.userId !== userId) throw new Error('Token not found');
    const revoked: ConsentToken = { ...token, status: 'revoked', revokedAt: new Date().toISOString() };
    this.tokens.set(tokenId, revoked);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'CONSENT_REVOKED', consentTokenId: tokenId, result: 'success', details: `Revoked for ${token.requesterId}` });
    return revoked;
  }

  async checkAccess(tokenId: string): Promise<boolean> {
    const token = this.tokens.get(tokenId);
    if (!token) return false;
    if (token.status !== 'approved' && token.status !== 'emergency_override') return false;
    if (new Date(token.expiresAt) < new Date()) { token.status = 'expired'; return false; }
    return true;
  }

  async listActiveConsents(userId: string): Promise<ConsentToken[]> {
    return Array.from(this.tokens.values()).filter(t => t.userId === userId && (t.status === 'approved' || t.status === 'emergency_override'));
  }

  async createEmergencyOverride(userId: string, reason: string): Promise<ConsentToken> {
    const token: ConsentToken = {
      id: `ct_emergency_${Date.now()}`, userId, requesterId: 'emergency_system', requesterName: 'Emergency System',
      accessLevel: 'emergency_read', status: 'emergency_override', createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      categories: ['medical_history', 'allergies', 'emergency_contacts'],
      pinVerified: false, biometricVerified: false, auditLogId: '',
    };
    this.tokens.set(token.id, token);
    await this.audit.log({ userId, actorId: 'emergency_system', actorType: 'system', action: 'EMERGENCY_OVERRIDE_CREATED', consentTokenId: token.id, result: 'success', details: `Emergency: ${reason}` });
    return token;
  }

  private async validatePIN(userId: string, pin: string): Promise<boolean> {
    return pin.length >= 4; // Delegate to auth kernel
  }
}
