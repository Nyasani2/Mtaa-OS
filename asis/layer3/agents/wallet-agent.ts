/**
 * WalletAgent
 * Handles all financial operations: balance, transfers, payments, claims, FX
 * Strict security: all actions require PIN/biometric confirmation
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { WalletAction, TransferIntent } from './types';
import { formatCurrency } from '../shared/utils';

export class WalletAgent extends BaseAgent {
  readonly name = 'wallet_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'balance_check',
    'transfer',
    'payment',
    'withdrawal',
    'deposit',
    'transaction_history',
    'claim_payment',
    'fx_conversion',
    'limit_check',
  ];

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
  }

  protected _registerTools(): void {
    this._tools.set('check_balance', {
      name: 'check_balance',
      description: 'Check wallet balance',
      parameters: [
        { name: 'currency', type: 'string', description: 'Currency code', required: false, default: 'KES' },
      ],
      returns: { type: 'object', description: 'Balance info' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('transfer', {
      name: 'transfer',
      description: 'Send money to another user',
      parameters: [
        { name: 'recipient', type: 'string', description: 'Phone number or user ID', required: true },
        { name: 'amount', type: 'number', description: 'Amount to send', required: true },
        { name: 'currency', type: 'string', description: 'Currency code', required: false, default: 'KES' },
        { name: 'description', type: 'string', description: 'Transfer note', required: false },
      ],
      returns: { type: 'object', description: 'Transfer result' },
      requiresAuth: true,
      riskLevel: 'high',
    });

    this._tools.set('get_transactions', {
      name: 'get_transactions',
      description: 'Get transaction history',
      parameters: [
        { name: 'limit', type: 'number', description: 'Number of transactions', required: false, default: 10 },
        { name: 'type', type: 'string', description: 'Filter by type', required: false },
      ],
      returns: { type: 'array', description: 'Transaction list' },
      requiresAuth: true,
      riskLevel: 'low',
    });

    this._tools.set('generate_claim_link', {
      name: 'generate_claim_link',
      description: 'Generate a claimable payment link',
      parameters: [
        { name: 'amount', type: 'number', description: 'Amount', required: true },
        { name: 'currency', type: 'string', description: 'Currency', required: false, default: 'KES' },
        { name: 'expiresIn', type: 'number', description: 'Expiry in hours', required: false, default: 24 },
      ],
      returns: { type: 'object', description: 'Claim link info' },
      requiresAuth: true,
      riskLevel: 'medium',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    return intent === 'wallet' || 
           entities.some((e) => ['transfer', 'payment', 'balance_check', 'claim'].includes(e));
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const validation = this._validateRequest(request);

    if (!validation.valid) {
      return this._createErrorResponse(validation.error || 'Invalid request');
    }

    this._state.status = 'processing';
    const { input, context } = request;
    const userContext = context.user;
    const countryProfile = context.system?.countryProfile;

    try {
      let response: AgentResponse;

      // Parse intent and entities
      const action = this._parseWalletAction(input);

      switch (action.type) {
        case 'balance_check':
          response = await this._handleBalanceCheck(userContext, countryProfile);
          break;
        case 'transfer':
          response = await this._handleTransfer(action.params as TransferIntent, userContext, countryProfile);
          break;
        case 'payment':
          response = await this._handlePayment(action.params, userContext, countryProfile);
          break;
        case 'transaction_history':
          response = await this._handleTransactionHistory(action.params, userContext);
          break;
        case 'claim':
          response = await this._handleClaim(action.params, userContext, countryProfile);
          break;
        default:
          response = this._createTextResponse(
            'I can help you with:

' +
            '• Check balance
' +
            '• Send money
' +
            '• Pay bills
' +
            '• View transactions
' +
            '• Create payment links

' +
            'What would you like to do?',
            { type: 'wallet_menu' }
          );
      }

      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
      return response;
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Wallet operation failed'
      );
    }
  }

  private _parseWalletAction(input: string): WalletAction {
    const lower = input.toLowerCase();

    // Balance check
    if (/balance|how much|what is my balance/.test(lower)) {
      return { type: 'balance_check', params: {}, requiresConfirmation: false };
    }

    // Transfer
    const transferMatch = lower.match(/send\s+(\d+(?:\.\d+)?)\s*(?:ksh|kes|usd|ugx|tzs)?\s*(?:to\s+)?(.+)?/i);
    if (transferMatch || /transfer|send money/.test(lower)) {
      return {
        type: 'transfer',
        params: {
          amount: transferMatch ? parseFloat(transferMatch[1]) : undefined,
          recipient: transferMatch?.[2]?.trim(),
          currency: 'KES',
        },
        requiresConfirmation: true,
      };
    }

    // Payment
    if (/pay|payment|buy|purchase/.test(lower)) {
      return { type: 'payment', params: {}, requiresConfirmation: true };
    }

    // Transaction history
    if (/transactions|history|statement|recent/.test(lower)) {
      return { type: 'transaction_history', params: {}, requiresConfirmation: false };
    }

    // Claim
    if (/claim|payment link|share money|request money/.test(lower)) {
      return { type: 'claim', params: {}, requiresConfirmation: true };
    }

    return { type: 'balance_check', params: {}, requiresConfirmation: false };
  }

  private async _handleBalanceCheck(userContext: any, countryProfile: any): Promise<AgentResponse> {
    // In production: call wallet service
    const currency = countryProfile?.currency?.code || 'KES';
    const symbol = countryProfile?.currency?.symbol || 'KSh';

    // Simulated balance (would come from service)
    const balance = 15420.50;
    const pending = 0;

    return this._createTextResponse(
      `**Your Wallet Balance**\n\n` +
      `${symbol}${balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}\n` +
      `${pending > 0 ? `Pending: ${symbol}${pending.toLocaleString()}` : ''}\n\n` +
      `Available for: Send, Pay, Withdraw, Deposit`,
      { type: 'balance', balance, currency }
    );
  }

  private async _handleTransfer(
    intent: TransferIntent,
    userContext: any,
    countryProfile: any
  ): Promise<AgentResponse> {
    const symbol = countryProfile?.currency?.symbol || 'KSh';

    if (!intent.amount || !intent.recipient) {
      return this._createActionResponse(
        'I need a bit more info to send money:\n\nWho would you like to send to, and how much?',
        [
          { label: 'Send to contact', type: 'open', payload: { action: 'select_contact' } },
          { label: 'Enter manually', type: 'open', payload: { action: 'enter_details' } },
        ],
        { type: 'transfer_prompt' }
      );
    }

    // Check limits
    const dailyLimit = userContext?.limits?.daily || 300000;
    if (intent.amount > dailyLimit) {
      return this._createTextResponse(
        `⚠️ This amount exceeds your daily limit of ${symbol}${dailyLimit.toLocaleString()}.\n\n` +
        `Please upgrade your KYC tier or reduce the amount.`,
        { type: 'limit_exceeded' }
      );
    }

    // Return confirmation-required response
    return this._createConfirmationResponse(
      `**Confirm Transfer**\n\n` +
      `Amount: ${symbol}${intent.amount.toLocaleString()}\n` +
      `To: ${intent.recipient}\n` +
      `Fee: ${symbol}0.00\n` +
      `Total: ${symbol}${intent.amount.toLocaleString()}\n\n` +
      `Please confirm with your PIN or biometric.`,
      {
        type: 'transfer',
        params: intent,
      },
      { type: 'transfer_confirmation' }
    );
  }

  private async _handlePayment(params: any, userContext: any, countryProfile: any): Promise<AgentResponse> {
    return this._createActionResponse(
      'What would you like to pay for?',
      [
        { label: '💡 Electricity', type: 'navigate', payload: { billType: 'electricity' } },
        { label: '💧 Water', type: 'navigate', payload: { billType: 'water' } },
        { label: '📱 Airtime', type: 'navigate', payload: { billType: 'airtime' } },
        { label: '🌐 Internet', type: 'navigate', payload: { billType: 'internet' } },
        { label: '📺 TV', type: 'navigate', payload: { billType: 'tv' } },
      ],
      { type: 'payment_menu' }
    );
  }

  private async _handleTransactionHistory(params: any, userContext: any): Promise<AgentResponse> {
    // Simulated transactions
    const transactions = [
      { id: '1', type: 'send', amount: 500, recipient: 'John Doe', date: Date.now() - 3600000, status: 'completed' },
      { id: '2', type: 'receive', amount: 1200, sender: 'Jane Smith', date: Date.now() - 86400000, status: 'completed' },
      { id: '3', type: 'payment', amount: 350, merchant: 'KPLC', date: Date.now() - 172800000, status: 'completed' },
    ];

    let text = '**Recent Transactions**\n\n';
    transactions.forEach((t) => {
      const sign = t.type === 'receive' ? '+' : '-';
      const party = t.recipient || t.sender || t.merchant;
      text += `${sign}KSh${t.amount} — ${party}\n`;
    });

    return this._createTextResponse(text, { type: 'transactions', transactions });
  }

  private async _handleClaim(params: any, userContext: any, countryProfile: any): Promise<AgentResponse> {
    return this._createActionResponse(
      'Create a payment link that anyone can claim:\n\nHow much and who is it for?',
      [
        { label: 'Create link', type: 'open', payload: { action: 'create_claim_link' } },
        { label: 'Share via WhatsApp', type: 'share', payload: { platform: 'whatsapp' } },
      ],
      { type: 'claim_menu' }
    );
  }
}
