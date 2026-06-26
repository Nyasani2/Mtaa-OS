// ============================================================================
// ASIS WALLET ADAPTER — Replaces old stubs
// Maps old ASIS wallet imports to the new Kamos-based intelligence engine
// ============================================================================

import { ASISWalletIntelligence } from './asis-wallet-intelligence';
import { createClient } from '@supabase/supabase-js';

// Singleton instance
let asisInstance: ASISWalletIntelligence | null = null;

export function getASISWalletIntelligence(): ASISWalletIntelligence {
  if (!asisInstance) {
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
    asisInstance = new ASISWalletIntelligence(supabase);
  }
  return asisInstance;
}

// Legacy class mappings — now delegate to real ASIS engine
export class FraudMonitor {
  static async check(transaction: any): Promise<{ risk: string; score: number }> {
    const asis = getASISWalletIntelligence();
    const sender = await asis.analyzeUser(transaction.sender_id);
    const recipient = await asis.detectRecipient(transaction.recipient_id || transaction.recipient_identifier);
    const field = await (asis as any).buildTransferField(sender, recipient, {
      senderProfileId: transaction.sender_id,
      recipientIdentifier: transaction.recipient_id || transaction.recipient_identifier,
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: Date.now(),
    });
    const fraud = await asis.analyzeKamosFraud(
      { senderProfileId: transaction.sender_id, recipientIdentifier: transaction.recipient_id || transaction.recipient_identifier, amount: transaction.amount, currency: transaction.currency, timestamp: Date.now() },
      sender, recipient, field
    );
    return { risk: fraud.riskLevel, score: fraud.riskScore };
  }
}

export class TransferOrchestrator {
  static async execute(transfer: any): Promise<{ success: boolean; id?: string }> {
    const asis = getASISWalletIntelligence();
    const result = await asis.orchestrateTransfer({
      senderProfileId: transfer.sender_id,
      recipientIdentifier: transfer.recipient_id || transfer.recipient_identifier,
      amount: transfer.amount,
      currency: transfer.currency,
      purpose: transfer.purpose,
      metadata: transfer.metadata,
      deviceId: transfer.device_id,
      location: transfer.location,
      biometricVerified: transfer.biometric_verified,
      timestamp: Date.now(),
    });
    return { success: result.result?.success || false, id: result.result?.transactionId };
  }
}

export class TransactionIntelligence {
  static async analyze(tx: any): Promise<{ pattern: string; confidence: number; riskScore: number }> {
    const asis = getASISWalletIntelligence();
    const intel = await asis.analyzeTransaction(tx);
    return {
      pattern: intel.predictedIntent,
      confidence: intel.confidence,
      riskScore: intel.riskScore,
    };
  }
}

export class WalletAssistant {
  static async suggest(userId: string): Promise<string[]> {
    const asis = getASISWalletIntelligence();
    const suggestions = await asis.generateSuggestions(userId);
    return suggestions.map(s => s.title);
  }

  static async getSuggestions(userId: string): Promise<any[]> {
    const asis = getASISWalletIntelligence();
    return asis.generateSuggestions(userId);
  }
}

export class TransactionValidator {
  static async validate(tx: any): Promise<{ valid: boolean; errors: string[] }> {
    const asis = getASISWalletIntelligence();
    const intel = await asis.analyzeTransfer({
      senderProfileId: tx.sender_id,
      recipientIdentifier: tx.recipient_id || tx.recipient_identifier,
      amount: tx.amount,
      currency: tx.currency,
      timestamp: Date.now(),
    });
    const errors: string[] = [];
    if (intel.decision === 'reject') errors.push('Transfer rejected by ASIS fraud analysis');
    if (intel.decision === 'limit') errors.push('Daily transfer limit exceeded');
    if (intel.requiresVerification) errors.push('Identity verification required');
    if (intel.requiresBiometric) errors.push('Biometric authentication required');
    return { valid: errors.length === 0, errors };
  }
}

export class TransferPolicy {
  static async check(sender: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    const asis = getASISWalletIntelligence();
    const intel = await asis.analyzeTransfer({
      senderProfileId: sender,
      recipientIdentifier: 'unknown',
      amount,
      currency: 'USD',
      timestamp: Date.now(),
    });
    return {
      allowed: intel.decision !== 'reject' && intel.decision !== 'limit',
      reason: intel.suggestedActions.join(', ') || undefined,
    };
  }
}

export { ASISWalletIntelligence };
