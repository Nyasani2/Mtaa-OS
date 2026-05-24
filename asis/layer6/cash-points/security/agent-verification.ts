/**
 * ASIS Layer 6 — Agent Verification
 * KYC levels, document verification, training, background checks
 */

import { AgentVerification } from '../types';

export class AgentVerificationSystem {
  private verifications: Map<string, AgentVerification> = new Map();

  /**
   * Create new agent verification record
   */
  createVerification(agentId: string): AgentVerification {
    const verification: AgentVerification = {
      agentId,
      kycLevel: 0,
      verifiedAt: new Date(),
      verificationMethod: 'self_registration',
      documents: [],
      backgroundCheck: false,
      trainingCompleted: false,
      suspensionCount: 0,
      lastReview: new Date(),
    };

    this.verifications.set(agentId, verification);
    return verification;
  }

  /**
   * Update KYC level
   */
  updateKyc(agentId: string, level: number, method: string): AgentVerification | null {
    const verification = this.verifications.get(agentId);
    if (!verification) return null;

    verification.kycLevel = level;
    verification.verificationMethod = method;
    verification.verifiedAt = new Date();
    verification.lastReview = new Date();

    return verification;
  }

  /**
   * Add document
   */
  addDocument(agentId: string, documentType: string): AgentVerification | null {
    const verification = this.verifications.get(agentId);
    if (!verification) return null;

    if (!verification.documents.includes(documentType)) {
      verification.documents.push(documentType);
    }

    return verification;
  }

  /**
   * Mark background check complete
   */
  completeBackgroundCheck(agentId: string): AgentVerification | null {
    const verification = this.verifications.get(agentId);
    if (!verification) return null;

    verification.backgroundCheck = true;
    verification.lastReview = new Date();

    return verification;
  }

  /**
   * Mark training complete
   */
  completeTraining(agentId: string): AgentVerification | null {
    const verification = this.verifications.get(agentId);
    if (!verification) return null;

    verification.trainingCompleted = true;
    verification.lastReview = new Date();

    return verification;
  }

  /**
   * Record suspension
   */
  recordSuspension(agentId: string): AgentVerification | null {
    const verification = this.verifications.get(agentId);
    if (!verification) return null;

    verification.suspensionCount++;
    verification.lastReview = new Date();

    return verification;
  }

  /**
   * Get verification status
   */
  getVerification(agentId: string): AgentVerification | null {
    return this.verifications.get(agentId) || null;
  }

  /**
   * Check if agent is fully verified
   */
  isFullyVerified(agentId: string): boolean {
    const v = this.verifications.get(agentId);
    if (!v) return false;

    return v.kycLevel >= 2 && v.backgroundCheck && v.trainingCompleted && v.suspensionCount === 0;
  }

  /**
   * Get verification summary
   */
  getSummary(agentId: string): {
    verified: boolean;
    kycLevel: number;
    documents: number;
    backgroundCheck: boolean;
    training: boolean;
    suspensions: number;
    status: 'verified' | 'pending' | 'suspended' | 'rejected';
  } | null {
    const v = this.verifications.get(agentId);
    if (!v) return null;

    let status: 'verified' | 'pending' | 'suspended' | 'rejected' = 'pending';

    if (v.suspensionCount > 0) status = 'suspended';
    else if (this.isFullyVerified(agentId)) status = 'verified';
    else if (v.kycLevel === 0) status = 'rejected';

    return {
      verified: this.isFullyVerified(agentId),
      kycLevel: v.kycLevel,
      documents: v.documents.length,
      backgroundCheck: v.backgroundCheck,
      training: v.trainingCompleted,
      suspensions: v.suspensionCount,
      status,
    };
  }
}
