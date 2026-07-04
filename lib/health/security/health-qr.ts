import { healthCrypto } from './health-crypto';

export type QRType = 'identity' | 'emergency' | 'share_request' | 'share_grant';

export interface HealthQRConfig {
  type: QRType;
  expiryMinutes: number;
  dataScope: string[];
}

export interface QRResult {
  valid: boolean;
  type: QRType;
  patientId?: string;
  hospitalId?: string;
  scope?: string[];
  expiresAt?: number;
  data?: any;
  error?: string;
}

const QR_VERSION = 'MTAA_HQR_v1';

export class HealthQR {
  async generateIdentityQR(patientId: string, profile: any): Promise<string> {
    const payload = {
      v: QR_VERSION,
      type: 'identity',
      pid: patientId,
      name: profile.fullName,
      dob: profile.dateOfBirth,
      blood: profile.bloodGroup,
      iat: Date.now(),
      exp: Date.now() + 60 * 60 * 1000,
    };
    return this.encodePayload(payload);
  }

  async generateEmergencyQR(emergencyData: any): Promise<string> {
    const payload = {
      v: QR_VERSION,
      type: 'emergency',
      name: emergencyData.fullName,
      blood: emergencyData.bloodGroup,
      allergies: emergencyData.allergies,
      conditions: emergencyData.chronicConditions,
      meds: emergencyData.currentCriticalMedications,
      contact: emergencyData.emergencyContacts?.[0],
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    };
    return this.encodePayload(payload);
  }

  async generateShareRequest(
    patientId: string,
    hospitalId: string,
    scope: string[],
    expiryMinutes: number
  ): Promise<string> {
    const payload = {
      v: QR_VERSION,
      type: 'share_request',
      pid: patientId,
      hid: hospitalId,
      scope,
      iat: Date.now(),
      exp: Date.now() + expiryMinutes * 60 * 1000,
    };
    return this.encodePayload(payload);
  }

  async generateShareGrant(requestToken: string, patientId: string): Promise<string> {
    const payload = {
      v: QR_VERSION,
      type: 'share_grant',
      req: requestToken,
      pid: patientId,
      grantedAt: Date.now(),
      exp: Date.now() + 60 * 60 * 1000,
    };
    return this.encodePayload(payload);
  }

  async scanQR(qrData: string): Promise<QRResult> {
    try {
      const payload = this.decodePayload(qrData);
      if (!payload.v || !payload.type) {
        return { valid: false, type: 'identity', error: 'Invalid QR format' };
      }
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, type: payload.type, error: 'QR expired' };
      }
      return {
        valid: true,
        type: payload.type,
        patientId: payload.pid,
        hospitalId: payload.hid,
        scope: payload.scope,
        expiresAt: payload.exp,
        data: payload,
      };
    } catch (e) {
      return { valid: false, type: 'identity', error: 'Failed to parse QR' };
    }
  }

  isValid(qrData: string): boolean {
    try {
      const payload = this.decodePayload(qrData);
      return !!(payload.v && payload.type && (!payload.exp || Date.now() < payload.exp));
    } catch {
      return false;
    }
  }

  private encodePayload(payload: any): string {
    const json = JSON.stringify(payload);
    return btoa(json);
  }

  private decodePayload(qrData: string): any {
    const json = atob(qrData);
    return JSON.parse(json);
  }
}

export const healthQR = new HealthQR();
