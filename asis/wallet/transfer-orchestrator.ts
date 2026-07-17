/**
 * MTAA ASIS — Transfer Orchestrator
 * Coordinates the pre-transfer authorization decision: validation +
 * policy checks. This layer decides whether a transfer MAY proceed;
 * it does not move money itself — actual balance changes go through
 * the verified Supabase RPCs (e.g. mtaa_add_wallet_transaction,
 * wallet_send) which remain the single source of truth for the ledger.
 */
import { TransactionValidator, ValidationInput } from './security/transaction-validator';
import { TransferPolicy } from './security/transfer-policy';
import { WalletAssistant } from './wallet-assistant';

export interface TransferDecision {
  approved: boolean;
  reasons: string[];
}

type BridgeBus = {
  on: (event: string, cb: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
};

export class TransferOrchestrator {
  constructor(
    private validator: TransactionValidator,
    private policy: TransferPolicy,
    private assistant: WalletAssistant,
    private bus: BridgeBus
  ) {}

  async authorize(input: ValidationInput): Promise<TransferDecision> {
    const reasons: string[] = [];

    const validation = await this.validator.validate(input);
    if (!validation.valid) {
      reasons.push(...validation.reasons);
    }

    const policyResult = await this.policy.check({
      senderId: input.senderId,
      recipientId: input.recipientId,
      amount: input.amount,
    });
    if (!policyResult.allowed) {
      reasons.push(...policyResult.violations);
    }

    const approved = reasons.length === 0;

    this.bus.emit('asis:transfer:authorized', {
      senderId: input.senderId,
      recipientId: input.recipientId,
      amount: input.amount,
      approved,
      reasons,
    });

    return { approved, reasons };
  }
}
