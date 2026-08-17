/**
 * MTAA ASIS — Transaction Validator
 * Validates a proposed wallet transfer against basic integrity rules
 * before it is allowed to proceed. This is a hard-gate check, not a
 * risk score — a failed validation always blocks the transaction.
 */
import { supabase } from '@/lib/supabase';

export interface ValidationInput {
  senderId: string;
  recipientId?: string;
  amount: number;
  currency?: string;
  walletId?: string;
}

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

export class TransactionValidator {
  async validate(input: ValidationInput): Promise<ValidationResult> {
    const reasons: string[] = [];

    if (!input.senderId) {
      reasons.push('Missing sender identity');
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      reasons.push('Transfer amount must be a positive number');
    }

    if (input.recipientId && input.recipientId === input.senderId) {
      reasons.push('Sender and recipient cannot be the same account');
    }

    // Verify the sender actually owns a wallet with sufficient balance.
    if (input.senderId && Number.isFinite(input.amount) && input.amount > 0) {
      const { data: wallet, error } = await supabase
        .from("wallet_accounts")
        .select('id, balance, user_id')
        .eq('user_id', input.senderId)
        .maybeSingle();

      if (error) {
        reasons.push(`Unable to verify sender wallet: ${error.message}`);
      } else if (!wallet) {
        reasons.push('Sender has no wallet on record');
      } else if (Number(wallet.balance) < input.amount) {
        reasons.push('Insufficient balance for this transfer');
      }
    }

    // If a recipient is specified, confirm it resolves to a real wallet.
    if (input.recipientId) {
      const { data: recipientWallet, error } = await supabase
        .from("wallet_accounts")
        .select('id')
        .eq('user_id', input.recipientId)
        .maybeSingle();

      if (error) {
        reasons.push(`Unable to verify recipient wallet: ${error.message}`);
      } else if (!recipientWallet) {
        reasons.push('Recipient has no wallet on record');
      }
    }

    return { valid: reasons.length === 0, reasons };
  }
}

