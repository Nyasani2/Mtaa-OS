/**
 * ASIS Layer 4 — Consent Manager UI Logic
 * Handles consent dialogs, granular permissions
 */

import { ContextScope } from '../types/memory.types';
import { ConsentRecord, ConsentStatus } from '../types/privacy.types';
import { PrivacyGate } from './privacy-gate';

export interface ConsentDialogConfig {
  title: string;
  description: string;
  scope: ContextScope;
  dataTypes: string[];
  agentTypes: string[];
  retentionDays: number;
  required: boolean;
}

export class ConsentManager {
  private privacyGate: PrivacyGate;
  private pendingDialogs: Map<string, ConsentDialogConfig> = new Map();

  constructor(privacyGate: PrivacyGate) {
    this.privacyGate = privacyGate;
  }

  /**
   * Check if consent dialog should be shown
   */
  async shouldShowConsent(scope: ContextScope): Promise<boolean> {
    const allowed = await this.privacyGate.getAllowedScopes();
    return !allowed.includes(scope);
  }

  /**
   * Create consent dialog config
   */
  createDialogConfig(scope: ContextScope): ConsentDialogConfig {
    const configs: Record<ContextScope, ConsentDialogConfig> = {
      [ContextScope.GLOBAL]: {
        title: 'General ASIS Access',
        description: 'Allow ASIS to remember your general preferences and context.',
        scope: ContextScope.GLOBAL,
        dataTypes: ['preferences', 'context'],
        agentTypes: ['all'],
        retentionDays: 365,
        required: true,
      },
      [ContextScope.WALLET]: {
        title: 'Wallet & Payments',
        description: 'Allow ASIS to access your wallet history for personalized financial guidance.',
        scope: ContextScope.WALLET,
        dataTypes: ['transactions', 'balances', 'payment_methods'],
        agentTypes: ['wallet_agent'],
        retentionDays: 2555, // 7 years for financial
        required: false,
      },
      [ContextScope.HEALTH]: {
        title: 'Health & Wellness',
        description: 'Allow ASIS to access health data for wellness suggestions. Your data is never shared with third parties.',
        scope: ContextScope.HEALTH,
        dataTypes: ['symptoms', 'appointments', 'providers'],
        agentTypes: ['health_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.TRANSPORT]: {
        title: 'Transport & Rides',
        description: 'Allow ASIS to remember your ride preferences and frequent routes.',
        scope: ContextScope.TRANSPORT,
        dataTypes: ['ride_history', 'locations', 'preferences'],
        agentTypes: ['mtaxi_agent', 'mtruck_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.CIVIC]: {
        title: 'Civic & Government',
        description: 'Allow ASIS to access civic records for government service assistance.',
        scope: ContextScope.CIVIC,
        dataTypes: ['records', 'applications', 'appointments'],
        agentTypes: ['civic_agent'],
        retentionDays: 1825, // 5 years
        required: false,
      },
      [ContextScope.SHOP]: {
        title: 'Shopping Preferences',
        description: 'Allow ASIS to remember your shopping preferences for better recommendations.',
        scope: ContextScope.SHOP,
        dataTypes: ['orders', 'preferences', 'browsing'],
        agentTypes: ['shop_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.MARKETPLACE]: {
        title: 'Marketplace Activity',
        description: 'Allow ASIS to access marketplace data for better seller/buyer matching.',
        scope: ContextScope.MARKETPLACE,
        dataTypes: ['listings', 'messages', 'transactions'],
        agentTypes: ['marketplace_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.EDUCATION]: {
        title: 'Education & Learning',
        description: 'Allow ASIS to access learning data for personalized education suggestions.',
        scope: ContextScope.EDUCATION,
        dataTypes: ['courses', 'progress', 'interests'],
        agentTypes: ['education_agent'],
        retentionDays: 1825,
        required: false,
      },
      [ContextScope.JOBS]: {
        title: 'Work & Employment',
        description: 'Allow ASIS to access job history for career guidance.',
        scope: ContextScope.JOBS,
        dataTypes: ['applications', 'skills', 'preferences'],
        agentTypes: ['jobs_agent'],
        retentionDays: 1825,
        required: false,
      },
      [ContextScope.TRIBES]: {
        title: 'Tribes & Community',
        description: 'Allow ASIS to access tribe data for community recommendations.',
        scope: ContextScope.TRIBES,
        dataTypes: ['memberships', 'activity', 'preferences'],
        agentTypes: ['tribes_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.ENGINEERING]: {
        title: 'Engineering Tools',
        description: 'Allow ASIS to access engineering project data.',
        scope: ContextScope.ENGINEERING,
        dataTypes: ['projects', 'calculations', 'simulations'],
        agentTypes: ['engineering_agent'],
        retentionDays: 365,
        required: false,
      },
      [ContextScope.ADMIN]: {
        title: 'System Administration',
        description: 'Full system access for administrators.',
        scope: ContextScope.ADMIN,
        dataTypes: ['all'],
        agentTypes: ['all'],
        retentionDays: 365,
        required: false,
      },
    };

    return configs[scope] || configs[ContextScope.GLOBAL];
  }

  /**
   * Show consent dialog and wait for response
   */
  async showConsent(scope: ContextScope): Promise<ConsentRecord> {
    const config = this.createDialogConfig(scope);
    const record = await this.privacyGate.requestConsent(
      scope,
      config.description,
      config.dataTypes,
      config.agentTypes,
      config.retentionDays
    );

    this.pendingDialogs.set(record.id, config);
    return record;
  }

  /**
   * Handle user response to consent dialog
   */
  async handleResponse(consentId: string, granted: boolean): Promise<ConsentRecord> {
    if (granted) {
      return await this.privacyGate.grantConsent(consentId);
    } else {
      const record = await this.privacyGate.revokeConsent(consentId);
      record.status = ConsentStatus.DENIED;
      return record;
    }
  }

  /**
   * Get all pending consent requests
   */
  getPendingDialogs(): ConsentDialogConfig[] {
    return Array.from(this.pendingDialogs.values());
  }
}
