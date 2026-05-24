import { RecordAccessGateway } from './record-access-gateway';
import { QRAccessSession } from './types';

export interface QRDisplayData { qrCode: string; sessionId: string; expiresAt: string; providerName?: string; }
export interface QRScanResult { success: boolean; sessionId?: string; userId?: string; error?: string; }

export class HealthQRSystem {
  constructor(private gateway: RecordAccessGateway) {}
  async generateQR(userId: string, providerId: string): Promise<QRDisplayData> {
    const session = await this.gateway.requestAccessViaQR(userId, providerId);
    return { qrCode: session.qrCode, sessionId: session.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
  }
  async scanQR(qrCode: string, providerId: string): Promise<QRScanResult> {
    try { const s = await this.gateway.scanQR(qrCode, providerId); return { success: true, sessionId: s.id, userId: s.userId }; }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Scan failed' }; }
  }
  async approveAccess(userId: string, sessionId: string, pin: string): Promise<QRAccessSession> { return this.gateway.approveQRSession(userId, sessionId, pin); }
  async endSession(sessionId: string): Promise<void> { return this.gateway.closeSession(sessionId); }
  async getSessionRecords(sessionId: string) { return this.gateway.getSessionRecords(sessionId); }
}
