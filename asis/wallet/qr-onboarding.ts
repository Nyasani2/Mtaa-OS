/**
 * ASIS Layer 5 — QR Onboarding System
 * QR payload generation and parsing for claims, referrals, payments
 */

import { QRPayload, ClaimLink, Currency } from './types';
import { ClaimLinkEngine } from './claim-link-engine';

export class QROnboarding {
  private claimEngine: ClaimLinkEngine;

  constructor(claimEngine: ClaimLinkEngine) {
    this.claimEngine = claimEngine;
  }

  /**
   * Generate QR payload for a claim
   */
  async generateClaimQR(claim: ClaimLink): Promise<string> {
    const payload: QRPayload = {
      type: 'claim',
      token: claim.token,
      senderId: claim.senderId,
      amount: claim.amount,
      currency: claim.currency,
      expiresAt: claim.expiresAt,
    };

    return this.encodePayload(payload);
  }

  /**
   * Generate QR for onboarding/referral
   */
  generateOnboardQR(referralCode: string, senderId: string, metadata?: Record<string, unknown>): string {
    const payload: QRPayload = {
      type: 'onboard',
      referralCode,
      senderId,
      metadata,
    };

    return this.encodePayload(payload);
  }

  /**
   * Generate QR for direct payment
   */
  generatePaymentQR(userId: string, amount?: number, currency?: Currency): string {
    const payload: QRPayload = {
      type: 'pay',
      senderId: userId,
      amount,
      currency,
    };

    return this.encodePayload(payload);
  }

  /**
   * Parse QR payload
   */
  parsePayload(qrData: string): QRPayload | null {
    try {
      // Try direct JSON
      const parsed = JSON.parse(qrData);
      if (this.isValidPayload(parsed)) {
        return this.normalizePayload(parsed);
      }
    } catch {
      // Try base64
      try {
        const decoded = atob(qrData);
        const parsed = JSON.parse(decoded);
        if (this.isValidPayload(parsed)) {
          return this.normalizePayload(parsed);
        }
      } catch {
        // Try URL format
        if (qrData.startsWith('mtaa://')) {
          return this.parseUrlPayload(qrData);
        }
      }
    }

    return null;
  }

  /**
   * Validate and process scanned QR
   */
  async processScannedQR(qrData: string, scannerUserId: string): Promise<{
    type: string;
    valid: boolean;
    action: string;
    data?: any;
    error?: string;
  }> {
    const payload = this.parsePayload(qrData);

    if (!payload) {
      return { type: 'unknown', valid: false, action: 'none', error: 'Invalid QR code' };
    }

    switch (payload.type) {
      case 'claim': {
        if (!payload.token) {
          return { type: 'claim', valid: false, action: 'none', error: 'Missing claim token' };
        }

        const validation = await this.claimEngine.validateToken(payload.token);
        if (!validation.valid) {
          return { type: 'claim', valid: false, action: 'none', error: validation.error };
        }

        return {
          type: 'claim',
          valid: true,
          action: 'show_claim_preview',
          data: validation.claim,
        };
      }

      case 'onboard': {
        return {
          type: 'onboard',
          valid: true,
          action: 'start_onboarding',
          data: {
            referralCode: payload.referralCode,
            senderId: payload.senderId,
            metadata: payload.metadata,
          },
        };
      }

      case 'pay': {
        return {
          type: 'pay',
          valid: true,
          action: 'initiate_payment',
          data: {
            recipientId: payload.senderId,
            amount: payload.amount,
            currency: payload.currency,
          },
        };
      }

      default:
        return { type: payload.type, valid: false, action: 'none', error: 'Unknown QR type' };
    }
  }

  private encodePayload(payload: QRPayload): string {
    const json = JSON.stringify(payload);
    // Use compact base64 for QR efficiency
    return btoa(json);
  }

  private isValidPayload(parsed: any): parsed is QRPayload {
    return parsed && typeof parsed === 'object' && ['claim', 'onboard', 'pay', 'referral'].includes(parsed.type);
  }

  private normalizePayload(parsed: any): QRPayload {
    return {
      type: parsed.type,
      token: parsed.token,
      senderId: parsed.senderId,
      amount: parsed.amount,
      currency: parsed.currency,
      referralCode: parsed.referralCode,
      metadata: parsed.metadata,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
    };
  }

  private parseUrlPayload(url: string): QRPayload | null {
    try {
      const urlObj = new URL(url);
      const type = urlObj.pathname.replace('/', '') as any;

      return {
        type,
        token: urlObj.searchParams.get('token') || undefined,
        senderId: urlObj.searchParams.get('sender') || undefined,
        amount: urlObj.searchParams.get('amount') ? parseFloat(urlObj.searchParams.get('amount')!) : undefined,
        currency: (urlObj.searchParams.get('currency') as Currency) || undefined,
        referralCode: urlObj.searchParams.get('ref') || undefined,
      };
    } catch {
      return null;
    }
  }
}
