// asis/wallet/transfer-orchestrator.ts
// ASIS Wallet Transfer Orchestrator
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface TransferRequest {
  senderId: string;
  recipientId?: string;
  recipientPhone?: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  senderBalance?: number;
  recipientBalance?: number;
  message: string;
  timestamp: string;
}

export interface TransferStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export class TransferOrchestrator {
  private steps: TransferStep[] = [];

  private addStep(name: string): TransferStep {
    const step: TransferStep = { name, status: 'pending' };
    this.steps.push(step);
    return step;
  }

  private updateStep(step: TransferStep, status: TransferStep['status'], error?: string) {
    step.status = status;
    if (status === 'running' && !step.startedAt) step.startedAt = new Date().toISOString();
    if (status === 'completed' || status === 'failed') step.completedAt = new Date().toISOString();
    if (error) step.error = error;
  }

  /**
   * Execute a full transfer with orchestration
   */
  async executeTransfer(request: TransferRequest): Promise<TransferResult> {
    const timestamp = new Date().toISOString();

    // Step 1: Validate
    const validateStep = this.addStep('validate');
    this.updateStep(validateStep, 'running');
    const validation = await this.validateTransfer(request);
    if (!validation.valid) {
      this.updateStep(validateStep, 'failed', validation.error);
      return {
        success: false,
        message: validation.error || 'Validation failed',
        timestamp,
      };
    }
    this.updateStep(validateStep, 'completed');

    // Step 2: Resolve recipient
    const resolveStep = this.addStep('resolve_recipient');
    this.updateStep(resolveStep, 'running');
    const recipientId = await this.resolveRecipient(request);
    if (!recipientId) {
      this.updateStep(resolveStep, 'failed', 'Recipient not found');
      return {
        success: false,
        message: 'Recipient not found',
        timestamp,
      };
    }
    this.updateStep(resolveStep, 'completed');

    // Step 3: Execute via RPC
    const executeStep = this.addStep('execute');
    this.updateStep(executeStep, 'running');
    try {
      const { error } = await supabase.rpc('wallet_send', {
        p_sender: request.senderId,
        p_receiver: recipientId,
        p_amount: request.amount,
      });

      if (error) {
        this.updateStep(executeStep, 'failed', error.message);
        return {
          success: false,
          message: error.message,
          timestamp,
        };
      }

      this.updateStep(executeStep, 'completed');
    } catch (e: any) {
      this.updateStep(executeStep, 'failed', e.message);
      return {
        success: false,
        message: e.message,
        timestamp,
      };
    }

    // Step 4: Record transaction
    const recordStep = this.addStep('record');
    this.updateStep(recordStep, 'running');
    const { data: txData, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: request.senderId,
        amount: -request.amount,
        type: 'transfer',
        status: 'completed',
        description: request.description || 'Transfer',
        reference: request.reference,
        metadata: {
          recipient_id: recipientId,
          ...request.metadata,
        },
      })
      .select()
      .single();

    if (txError) {
      this.updateStep(recordStep, 'failed', txError.message);
    } else {
      this.updateStep(recordStep, 'completed');
    }

    return {
      success: true,
      transactionId: txData?.id,
      reference: request.reference,
      message: 'Transfer completed successfully',
      timestamp,
    };
  }

  private async validateTransfer(request: TransferRequest): Promise<{ valid: boolean; error?: string }> {
    if (!request.senderId) return { valid: false, error: 'Sender ID required' };
    if (!request.recipientId && !request.recipientPhone) return { valid: false, error: 'Recipient required' };
    if (request.amount <= 0) return { valid: false, error: 'Amount must be positive' };

    // Check sender balance
    const { data: wallet, error } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', request.senderId)
      .single();

    if (error || !wallet) return { valid: false, error: 'Sender wallet not found' };
    if ((wallet.balance || 0) < request.amount) return { valid: false, error: 'Insufficient balance' };

    return { valid: true };
  }

  private async resolveRecipient(request: TransferRequest): Promise<string | null> {
    if (request.recipientId) return request.recipientId;
    if (request.recipientPhone) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('phone', request.recipientPhone)
        .single();
      if (!error && data) return data.user_id;
    }
    return null;
  }

  getSteps(): TransferStep[] {
    return [...this.steps];
  }
}

export default TransferOrchestrator;
