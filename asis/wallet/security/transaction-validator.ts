// asis/wallet/security/transaction-validator.ts
// ASIS Wallet Transaction Validator
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface ValidationRule {
  name: string;
  enabled: boolean;
  priority: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  passedRules: string[];
  failedRules: string[];
}

export interface TransactionToValidate {
  userId: string;
  amount: number;
  type: string;
  recipientId?: string;
  metadata?: Record<string, any>;
}

export class TransactionValidator {
  private rules: ValidationRule[] = [
    { name: 'amount_positive', enabled: true, priority: 1 },
    { name: 'sufficient_balance', enabled: true, priority: 2 },
    { name: 'recipient_exists', enabled: true, priority: 3 },
    { name: 'daily_limit', enabled: true, priority: 4 },
    { name: 'self_transfer_check', enabled: true, priority: 5 },
  ];

  /**
   * Validate a transaction against all enabled rules
   */
  async validate(tx: TransactionToValidate): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      passedRules: [],
      failedRules: [],
    };

    for (const rule of this.rules.sort((a, b) => a.priority - b.priority)) {
      if (!rule.enabled) continue;

      const passed = await this.checkRule(rule.name, tx);
      if (passed) {
        result.passedRules.push(rule.name);
      } else {
        result.failedRules.push(rule.name);
        result.valid = false;
        result.errors.push(this.getErrorMessage(rule.name, tx));
      }
    }

    return result;
  }

  private async checkRule(ruleName: string, tx: TransactionToValidate): Promise<boolean> {
    switch (ruleName) {
      case 'amount_positive':
        return tx.amount > 0;

      case 'sufficient_balance': {
        const { data: wallet } = await supabase
          .from('wallet_accounts')
          .select('balance')
          .eq('user_id', tx.userId)
          .single();
        return (wallet?.balance || 0) >= tx.amount;
      }

      case 'recipient_exists': {
        if (!tx.recipientId) return true; // Not all tx types need recipient
        const { data } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', tx.recipientId)
          .single();
        return !!data;
      }

      case 'daily_limit': {
        const today = new Date().toISOString().split('T')[0];
        const { data: txs } = await supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('user_id', tx.userId)
          .gte('created_at', today)
          .lt('amount', 0);
        const dailySpent = (txs || []).reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);
        const { data: wallet } = await supabase
          .from('wallet_accounts')
          .select('daily_limit')
          .eq('user_id', tx.userId)
          .single();
        const limit = wallet?.daily_limit || 100000;
        return dailySpent + tx.amount <= limit;
      }

      case 'self_transfer_check':
        return tx.userId !== tx.recipientId;

      default:
        return true;
    }
  }

  private getErrorMessage(ruleName: string, tx: TransactionToValidate): string {
    const messages: Record<string, string> = {
      amount_positive: 'Amount must be greater than zero',
      sufficient_balance: 'Insufficient balance for this transaction',
      recipient_exists: 'Recipient not found',
      daily_limit: 'Daily transaction limit exceeded',
      self_transfer_check: 'Cannot transfer to yourself',
    };
    return messages[ruleName] || `Validation failed: ${ruleName}`;
  }

  /**
   * Add a custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Enable/disable a rule
   */
  toggleRule(name: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.name === name);
    if (rule) rule.enabled = enabled;
  }
}

export default TransactionValidator;
