import { IRecordAccessGateway } from './interfaces';
import { QRAccessSession, HealthRecord } from './types';
import { HealthVault } from './health-vault';
import { ConsentManager } from './consent-manager';
import { HealthAuditLog } from './audit-log';

export class RecordAccessGateway implements IRecordAccessGateway {
  private sessions: Map<string, QRAccessSession> = new Map();
  constructor(private vault: HealthVault, private consent: ConsentManager, private audit: HealthAuditLog) {}

  async requestAccessViaQR(userId: string, providerId: string): Promise<QRAccessSession> {
    const qrCode = btoa(JSON.stringify({ u: userId, p: providerId, t: Date.now() }));
    const session: QRAccessSession = { id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, providerId, qrCode, status: 'generated', createdAt: new Date().toISOString(), consentTokenId: '', recordsAccessed: [] };
    this.sessions.set(session.id, session);
    await this.audit.log({ userId, actorId: providerId, actorType: 'provider', action: 'QR_ACCESS_REQUESTED', result: 'success', details: `QR for ${providerId}` });
    return session;
  }

  async scanQR(qrCode: string, providerId: string): Promise<QRAccessSession> {
    const session = Array.from(this.sessions.values()).find(s => s.qrCode === qrCode && s.providerId === providerId);
    if (!session) throw new Error('Invalid QR');
    if (session.status !== 'generated') throw new Error('QR already used');
    const updated: QRAccessSession = { ...session, status: 'scanned', scannedAt: new Date().toISOString() };
    this.sessions.set(session.id, updated);
    await this.audit.log({ userId: session.userId, actorId: providerId, actorType: 'provider', action: 'QR_SCANNED', result: 'success', details: `Provider ${providerId} scanned` });
    return updated;
  }

  async approveQRSession(userId: string, sessionId: string, pin: string): Promise<QRAccessSession> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) throw new Error('Session not found');
    if (session.status !== 'scanned') throw new Error('Not scannable');
    const token = await this.consent.requestAccess(session.providerId, userId, ['medical_history', 'prescriptions', 'visits', 'lab_results', 'allergies'], 'write');
    const approved = await this.consent.approveConsent(userId, token.id, pin);
    const updated: QRAccessSession = { ...session, status: 'approved', approvedAt: new Date().toISOString(), consentTokenId: approved.id };
    this.sessions.set(sessionId, updated);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'QR_SESSION_APPROVED', result: 'success', details: `Approved for ${session.providerId}` });
    return updated;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId); if (!session) return;
    if (session.consentTokenId) { try { await this.consent.revokeConsent(session.userId, session.consentTokenId); } catch {} }
    const updated: QRAccessSession = { ...session, status: 'closed', closedAt: new Date().toISOString() };
    this.sessions.set(sessionId, updated);
    await this.audit.log({ userId: session.userId, actorId: session.providerId, actorType: 'provider', action: 'QR_SESSION_CLOSED', result: 'success', details: `Closed. Accessed: ${session.recordsAccessed.length}` });
  }

  async getSessionRecords(sessionId: string): Promise<HealthRecord[]> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'approved') throw new Error('Session not active');
    const hasAccess = await this.consent.checkAccess(session.consentTokenId);
    if (!hasAccess) throw new Error('Consent expired');
    const records = await this.vault.getRecords(session.userId);
    session.recordsAccessed = [...new Set([...session.recordsAccessed, ...records.map(r => r.id)])];
    this.sessions.set(sessionId, session);
    return records;
  }
}
