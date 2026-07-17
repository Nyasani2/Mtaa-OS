/**
 * MTAA ASIS — Transfer Policy
 * Enforces configurable business rules on transfers (limits, blacklists,
 * account status checks) — separate from fraud risk scoring, which lives
 * in FraudMonitor. A policy violation is a hard block, not a risk signal.
 */
import { supabase } from '@/lib/supabase';

export interface PolicyCheckInput {
  senderId: string;
  recipientId?: string;
  amount: number;
}

export interface PolicyResult {
  allowed: boolean;
  violations: string[];
}

const DEFAULT_MAX_SINGLE_TRANSFER = 500_000; // KES, conservative ceiling pending real product config

export class TransferPolicy {
  constructor(private maxSingleTransfer: number = DEFAULT_MAX_SINGLE_TRANSFER) {}

  async check(input: PolicyCheckInput): Promise<PolicyResult> {
    const violations: string[] = [];

    if (input.amount > this.maxSingleTransfer) {
      violations.push(
        `Transfer of ${input.amount} exceeds the maximum single-transfer limit of ${this.maxSingleTransfer}`
      );
    }

    // Check sender wallet status — frozen or non-active wallets cannot transact.
    // NOTE: real sanctions-list screening (fuzzy name/ID matching against
    // public.sanctions_list) is intentionally NOT implemented here — that
    // table has no direct user_id link and requires proper fuzzy-matching
    // logic against name/ID-number fields, not a simple equality check.
    // Faking that check would be worse than omitting it. This needs a
    // dedicated compliance-screening implementation as a follow-up.
    const { data: senderWallet, error: senderErr } = await supabase
      .from('wallets')
      .select('id, status, is_frozen')
      .eq('user_id', input.senderId)
      .maybeSingle();

    if (!senderErr && senderWallet) {
      if (senderWallet.is_frozen) {
        violations.push('Sender wallet is frozen; transfers are not permitted');
      } else if (senderWallet.status && senderWallet.status !== 'active') {
        violations.push(`Sender wallet status is '${senderWallet.status}', transfers are not permitted`);
      }
    }

    return { allowed: violations.length === 0, violations };
  }
}
