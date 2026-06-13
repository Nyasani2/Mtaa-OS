/**
 * ASIS Layer 5 — Transaction Validator
 * Validation pipeline: dry-run → confirm → execute → audit
 */

import { Transfer, TransferPreview, TransferStatus } from '../types';
import { TransferPolicyEngine } from './transfer-policy';
import { FraudMonitor } from '../fraud-monitor';
import { EventBus } from '../../kernel/event-bus';

export interface ValidationResult {
  valid: boolean;
  stage: 'dry_run' | 'confirm' | 'execute';
  errors: string[];
  warnings: string[];
  preview?: TransferPreview;
  requiresPin: boolean;
  requiresBiometric: boolean;
  requiresConfirmation: boolean;
}

export class TransactionValidator {
  private policy: TransferPolicyEngine;
  private fraudMonitor: FraudMonitor;
  private eventBus: EventBus;

  constructor(policy: TransferPolicyEngine, fraudMonitor: FraudMonitor, eventBus: EventBus) {
    this.policy = policy;
    this.fraudMonitor = fraudMonitor;
    this.eventBus = eventBus;
  }

  /**
   * Stage 1: Dry-run validation
   */
  async dryRun(
    kycLevel: number,
    transfer: Omit<Transfer, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Policy check
    const policyCheck = this.policy.checkTransfer(kycLevel, transfer);
    if (!policyCheck.allowed) {
      errors.push(policyCheck.reason!);
    }

    // Fraud check
    const fraudCheck = await this.fraudMonitor.analyzeTransfer(transfer as Transfer);
    if (fraudCheck.blocked) {
      errors.push('Transfer blocked by security system');
    }
    if (fraudCheck.risk > 30) {
      warnings.push(...fraudCheck.alerts);
    }

    // Device check
    const deviceCheck = await this.fraudMonitor.checkDevice(
      transfer.senderId,
      transfer.metadata?.deviceId as string,
      'transfer'
    );
    if (deviceCheck.risk > 0) {
      warnings.push(...deviceCheck.alerts);
    }

    // Get confirmation requirements
    const confirmations = this.policy.getRequiredConfirmations(kycLevel, transfer.amount);

    return {
      valid: errors.length === 0,
      stage: 'dry_run',
      errors,
      warnings,
      requiresPin: confirmations.pin,
      requiresBiometric: confirmations.biometric,
      requiresConfirmation: confirmations.confirmation,
    };
  }

  /**
   * Stage 2: Confirm validation (after user confirmation)
   */
  async confirm(
    kycLevel: number,
    transfer: Omit<Transfer, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    confirmation: { pin?: string; biometric?: boolean; confirmed: boolean }
  ): Promise<ValidationResult> {
    // Re-run dry-run
    const dryRun = await this.dryRun(kycLevel, transfer);
    if (!dryRun.valid) return { ...dryRun, stage: 'confirm' };

    const errors: string[] = [];

    // Check confirmation
    if (!confirmation.confirmed) {
      errors.push('User did not confirm transfer');
    }

    // Check PIN
    const confirmations = this.policy.getRequiredConfirmations(kycLevel, transfer.amount);
    if (confirmations.pin && !confirmation.pin) {
      errors.push('PIN required');
    }

    // Check biometric
    if (confirmations.biometric && !confirmation.biometric) {
      errors.push('Biometric confirmation required');
    }

    return {
      valid: errors.length === 0,
      stage: 'confirm',
      errors,
      warnings: dryRun.warnings,
      requiresPin: confirmations.pin,
      requiresBiometric: confirmations.biometric,
      requiresConfirmation: confirmations.confirmation,
    };
  }

  /**
   * Stage 3: Execute validation (final check before execution)
   */
  async execute(
    kycLevel: number,
    transfer: Transfer,
    confirmation: { pin?: string; biometric?: boolean; confirmed: boolean }
  ): Promise<ValidationResult> {
    const confirmResult = await this.confirm(kycLevel, transfer, confirmation);
    if (!confirmResult.valid) return { ...confirmResult, stage: 'execute' };

    // Final fraud check
    const fraudCheck = await this.fraudMonitor.analyzeTransfer(transfer);
    if (fraudCheck.blocked) {
      return {
        valid: false,
        stage: 'execute',
        errors: ['Transfer blocked by security system'],
        warnings: fraudCheck.alerts,
        requiresPin: confirmResult.requiresPin,
        requiresBiometric: confirmResult.requiresBiometric,
        requiresConfirmation: confirmResult.requiresConfirmation,
      };
    }

    // Anti-replay: check if transfer already processed
    if (transfer.status !== TransferStatus.PENDING) {
      return {
        valid: false,
        stage: 'execute',
        errors: ['Transfer already processed'],
        warnings: [],
        requiresPin: false,
        requiresBiometric: false,
        requiresConfirmation: false,
      };
    }

    // Emit audit event
    this.eventBus.emit('security:transfer_validated', {
      transferId: transfer.id,
      senderId: transfer.senderId,
      amount: transfer.amount,
      kycLevel,
      timestamp: new Date(),
    });

    return {
      valid: true,
      stage: 'execute',
      errors: [],
      warnings: confirmResult.warnings,
      requiresPin: confirmResult.requiresPin,
      requiresBiometric: confirmResult.requiresBiometric,
      requiresConfirmation: confirmResult.requiresConfirmation,
    };
  }
}