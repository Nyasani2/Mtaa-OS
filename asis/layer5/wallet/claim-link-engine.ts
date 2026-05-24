/**
 * ASIS Layer 5 — Claim Link Engine
 * Viral growth infrastructure: send money → recipient installs → claims
 * Secure tokens, expiration, anti-replay, audit logging
 */

import { ClaimLink, ClaimStatus, Transfer, TransferStatus, Currency } from './types';
import { IClaimProvider } from './interfaces';
import { EventBus } from '../kernel/event-bus';
import { PrivacyGate } from '../memory/privacy-gate';

export interface ClaimConfig {
  defaultExpiryHours: number;
  maxClaims: number;
  tokenLength: number;
  requireInstall: boolean;
}

export class ClaimLinkEngine implements IClaimProvider {
  private claims: Map<string, ClaimLink> = new Map();
  private config: ClaimConfig;
  private eventBus: EventBus;
  private privacyGate: PrivacyGate;

  constructor(eventBus: EventBus, privacyGate: PrivacyGate, config: Partial<ClaimConfig> = {}) {
    this.eventBus = eventBus;
    this.privacyGate = privacyGate;
    this.config = {
      defaultExpiryHours: 168, // 7 days
      maxClaims: 1,
      tokenLength: 32,
      requireInstall: true,
      ...config,
    };
  }

  /**
   * Generate secure claim token for a transfer
   */
  async generateToken(transferId: string, metadata?: Record<string, unknown>): Promise<string> {
    const token = this.generateSecureToken();
    const now = new Date();

    const claim: ClaimLink = {
      token,
      transferId,
      senderId: metadata?.senderId as string || 'unknown',
      senderName: metadata?.senderName as string || 'Someone',
      amount: metadata?.amount as number || 0,
      currency: (metadata?.currency as Currency) || Currency.KES,
      status: ClaimStatus.ACTIVE,
      recipientPhone: metadata?.recipientPhone as string,
      recipientEmail: metadata?.recipientEmail as string,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.defaultExpiryHours * 3600000),
      claimCount: 0,
      maxClaims: this.config.maxClaims,
    };

    this.claims.set(token, claim);

    // Emit event for notifications
    this.eventBus.emit('wallet:claim_created', {
      token,
      transferId,
      senderId: claim.senderId,
      recipientPhone: claim.recipientPhone,
      amount: claim.amount,
      currency: claim.currency,
    });

    // Audit log
    this.eventBus.emit('security:audit', {
      action: 'claim_token_generated',
      transferId,
      token: token.substring(0, 8) + '...',
      timestamp: now,
    });

    return token;
  }

  /**
   * Validate claim token
   */
  async validateToken(token: string): Promise<{ valid: boolean; claim?: ClaimLink; error?: string }> {
    const claim = this.claims.get(token);

    if (!claim) {
      return { valid: false, error: 'Invalid or expired claim link' };
    }

    if (claim.status === ClaimStatus.CLAIMED) {
      return { valid: false, error: 'This money has already been claimed' };
    }

    if (claim.status === ClaimStatus.EXPIRED || claim.expiresAt < new Date()) {
      claim.status = ClaimStatus.EXPIRED;
      return { valid: false, error: 'This claim link has expired' };
    }

    if (claim.status === ClaimStatus.REVOKED) {
      return { valid: false, error: 'This claim has been cancelled by the sender' };
    }

    if (claim.claimCount >= claim.maxClaims) {
      return { valid: false, error: 'Maximum claims reached for this link' };
    }

    return { valid: true, claim };
  }

  /**
   * Mark claim as claimed by recipient
   */
  async markClaimed(token: string, userId: string): Promise<{ success: boolean; transfer?: Transfer }> {
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      return { success: false };
    }

    const claim = validation.claim!;
    claim.claimCount++;
    claim.claimedAt = new Date();
    claim.claimedBy = userId;
    claim.status = ClaimStatus.CLAIMED;

    // Create transfer record for recipient
    const transfer: Transfer = {
      id: `txf_claim_${Date.now()}`,
      senderId: claim.senderId,
      senderWalletId: claim.senderId,
      recipientId: userId,
      recipientWalletId: userId,
      amount: claim.amount,
      currency: claim.currency,
      fee: 0,
      totalAmount: claim.amount,
      status: TransferStatus.CLAIMED,
      method: 'mtaa_wallet' as any,
      description: `Claimed from ${claim.senderName}`,
      metadata: { claimToken: token, claimedAt: claim.claimedAt },
      createdAt: claim.createdAt,
      updatedAt: new Date(),
      completedAt: new Date(),
    };

    // Emit events
    this.eventBus.emit('wallet:claim_claimed', {
      token,
      transferId: transfer.id,
      recipientId: userId,
      amount: claim.amount,
      currency: claim.currency,
    });

    this.eventBus.emit('security:audit', {
      action: 'claim_completed',
      transferId: transfer.id,
      token: token.substring(0, 8) + '...',
      recipientId: userId,
      timestamp: new Date(),
    });

    return { success: true, transfer };
  }

  /**
   * Revoke claim (sender cancels)
   */
  async revokeToken(token: string): Promise<boolean> {
    const claim = this.claims.get(token);
    if (!claim) return false;

    if (claim.status === ClaimStatus.CLAIMED) {
      return false; // Already claimed, cannot revoke
    }

    claim.status = ClaimStatus.REVOKED;

    this.eventBus.emit('wallet:claim_revoked', {
      token,
      transferId: claim.transferId,
      senderId: claim.senderId,
    });

    return true;
  }

  /**
   * Get claim by token
   */
  getClaim(token: string): ClaimLink | undefined {
    return this.claims.get(token);
  }

  /**
   * Get all claims for a sender
   */
  getClaimsBySender(senderId: string): ClaimLink[] {
    return Array.from(this.claims.values()).filter(c => c.senderId === senderId);
  }

  /**
   * Get pending claims for a phone number
   */
  getPendingClaimsForPhone(phone: string): ClaimLink[] {
    return Array.from(this.claims.values()).filter(
      c => c.recipientPhone === phone && c.status === ClaimStatus.ACTIVE
    );
  }

  /**
   * Health check
   */
  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  /**
   * Cleanup expired claims
   */
  async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [token, claim] of this.claims) {
      if (claim.status === ClaimStatus.ACTIVE && claim.expiresAt < now) {
        claim.status = ClaimStatus.EXPIRED;
        cleaned++;

        this.eventBus.emit('wallet:claim_expired', {
          token,
          transferId: claim.transferId,
        });
      }
    }

    return cleaned;
  }

  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < this.config.tokenLength; i++) {
      token += chars[array[i] % chars.length];
    }
    return `claim_${token}`;
  }
}
