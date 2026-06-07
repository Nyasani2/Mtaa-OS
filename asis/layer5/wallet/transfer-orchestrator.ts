/**
 * ASIS Layer 5 — Transfer Orchestrator
 * Coordinates transfer flow with safety controls
 * All actions: validate → dry-run → confirm → execute → audit
 */

import {
  Transfer,
  TransferStatus,
  TransferPreview,
  PaymentMethod,
  Currency,
  WalletAccount,
} from './types';
import { IPaymentRouteProvider } from './interfaces';
import { TransactionValidator } from './security/transaction-validator';
import { TransferPolicy } from './security/transfer-policy';
import { WalletAssistant } from './wallet-assistant';
import { EventBus } from '../kernel/event-bus';

export interface TransferConfig {
  defaultMethod: PaymentMethod;
  confirmationThreshold: number;
  pinRequiredAbove: number;
  biometricRequiredAbove: number;
}

export class TransferOrchestrator {
  private providers: Map<PaymentMethod, IPaymentRouteProvider> = new Map();
  private validator: TransactionValidator;
  private policy: TransferPolicy;
  private assistant: WalletAssistant;
  private eventBus: EventBus;
  private config: TransferConfig;

  constructor(
    validator: TransactionValidator,
    policy: TransferPolicy,
    assistant: WalletAssistant,
    eventBus: EventBus,
    config: Partial<TransferConfig> = {}
  ) {
    this.validator = validator;
    this.policy = policy;
    this.assistant = assistant;
    this.eventBus = eventBus;
    this.config = {
      defaultMethod: PaymentMethod.MTAA_WALLET,
      confirmationThreshold: 1000,
      pinRequiredAbove: 5000,
      biometricRequiredAbove: 50000,
      ...config,
    };
  }

  registerProvider(method: PaymentMethod, provider: IPaymentRouteProvider): void {
    this.providers.set(method, provider);
  }

  /**
   * Step 1: Validate transfer request
   */
  async validate(
    senderId: string,
    recipientId: string | undefined,
    amount: number,
    currency: Currency,
    method: PaymentMethod
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Policy checks
    if (amount < this.policy.minAmount) {
      errors.push(`Minimum transfer amount is ${this.policy.minAmount} ${currency}`);
    }
    if (amount > this.policy.maxAmount) {
      errors.push(`Maximum transfer amount is ${this.policy.maxAmount} ${currency}`);
    }
    if (!this.policy.allowedMethods.includes(method)) {
      errors.push(`Payment method ${method} is not allowed`);
    }
    if (!this.policy.allowedCurrencies.includes(currency)) {
      errors.push(`Currency ${currency} is not supported`);
    }

    // KYC checks
    // const senderKyc = await this.getSenderKyc(senderId);
    // if (senderKyc < this.policy.requireKyc) {
    //   errors.push('KYC verification required for this transfer');
    // }

    // Provider availability
    const provider = this.providers.get(method);
    if (!provider) {
      errors.push(`No provider available for ${method}`);
    } else {
      const health = await provider.health();
      if (!health.available) {
        warnings.push(`${method} provider is currently unavailable. Transfer may be delayed.`);
      }
    }

    // Anomaly detection
    const anomaly = await this.assistant.detectAnomaly(senderId, 'large_transfer');
    if (anomaly.anomaly) {
      warnings.push(anomaly.warning!);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Step 2: Dry-run preview
   */
  async preview(
    senderId: string,
    recipientId: string | undefined,
    amount: number,
    currency: Currency,
    method: PaymentMethod,
    targetCurrency?: Currency
  ): Promise<TransferPreview> {
    const provider = this.providers.get(method);

    const transferBase = {
      senderId,
      senderWalletId: senderId, // Simplified
      recipientId,
      amount,
      currency,
      method,
      targetCurrency,
      description: '',
      metadata: {},
    };

    // Get fee estimate
    const fees = provider 
      ? await provider.estimateFees(transferBase as any)
      : this.defaultFeeEstimate(amount, currency);

    // Get FX rate if cross-currency
    let fxRate = undefined;
    if (targetCurrency && targetCurrency !== currency) {
      // Would call FX engine here
      fxRate = {
        from: currency,
        to: targetCurrency,
        rate: 1.0, // Placeholder
        inverseRate: 1.0,
        spread: 0.02,
        provider: 'estimated',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        estimated: true,
      };
    }

    const totalAmount = amount + fees.totalFee;

    const preview: TransferPreview = {
      transfer: {
        ...transferBase,
        fee: fees.totalFee,
        totalAmount,
      } as any,
      fees,
      fxRate,
      warnings: [],
      confirmationRequired: amount >= this.config.confirmationThreshold,
      estimatedCompletion: provider 
        ? await provider.estimateCompletion(transferBase as any)
        : new Date(Date.now() + 60000),
    };

    // Add warnings
    const validation = await this.validate(senderId, recipientId, amount, currency, method);
    preview.warnings = validation.warnings;

    return preview;
  }

  /**
   * Step 3: Execute transfer (after confirmation)
   */
  async execute(
    transfer: Omit<Transfer, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    confirmation: { pin?: string; biometric?: boolean; confirmed: boolean }
  ): Promise<Transfer> {
    if (!confirmation.confirmed) {
      throw new TransferError('Transfer not confirmed by user');
    }

    // Validate PIN if required
    if (transfer.totalAmount >= this.config.pinRequiredAbove && !confirmation.pin) {
      throw new TransferError('PIN required for this transfer amount');
    }

    // Validate biometric if required
    if (transfer.totalAmount >= this.config.biometricRequiredAbove && !confirmation.biometric) {
      throw new TransferError('Biometric confirmation required for this transfer amount');
    }

    // Final validation
    const validation = await this.validate(
      transfer.senderId,
      transfer.recipientId,
      transfer.amount,
      transfer.currency,
      transfer.method
    );
    if (!validation.valid) {
      throw new TransferError(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create transfer record
    const transferRecord: Transfer = {
      ...transfer,
      id: `txf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: TransferStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Emit audit event
    this.eventBus.emit('wallet:transfer_initiated', {
      transferId: transferRecord.id,
      senderId: transferRecord.senderId,
      amount: transferRecord.amount,
      currency: transferRecord.currency,
      method: transferRecord.method,
    });

    // Execute via provider
    const provider = this.providers.get(transfer.method);
    if (provider) {
      try {
        const result = await provider.execute(transferRecord);
        if (result.success) {
          transferRecord.status = TransferStatus.COMPLETED;
          transferRecord.completedAt = new Date();
        } else {
          transferRecord.status = TransferStatus.FAILED;
        }
      } catch (error) {
        transferRecord.status = TransferStatus.FAILED;
      }
    } else {
      // No provider — create claimable transfer
      transferRecord.status = TransferStatus.PENDING;
    }

    // Emit completion event
    this.eventBus.emit('wallet:transfer_complete', {
      transferId: transferRecord.id,
      status: transferRecord.status,
      senderId: transferRecord.senderId,
    });

    return transferRecord;
  }

  private defaultFeeEstimate(amount: number, currency: Currency): any {
    const percentageFee = amount * 0.01; // 1%
    return {
      baseFee: 0,
      percentageFee,
      minimumFee: 10,
      maximumFee: 500,
      fxSpread: 0,
      totalFee: Math.max(10, Math.min(500, percentageFee)),
      totalAmount: amount + Math.max(10, Math.min(500, percentageFee)),
      breakdown: { platform: Math.max(10, Math.min(500, percentageFee)) },
    };
  }
}

export class TransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransferError';
  }
}