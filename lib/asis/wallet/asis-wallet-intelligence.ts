// ============================================================================
// ASIS WALLET INTELLIGENCE ENGINE v3 — KAMOS FOUNDATION
// ============================================================================
// Architecture: ASIS decides. Wallet executes.
// Mathematical Foundation: Kamos Theory
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import {
  KamosEntity, KamosField, kamosMultiply, kamosEvolve, kamosResonance,
  kamosFieldCoherence, kamosTrustEmergence, kamosDetectAnomaly, kamosPredict,
} from './kamos-theory';
import {
  KamosUserProfile, KamosBehaviourProfile, KamosNetworkNode, KamosTransferRequest,
  KamosTransferIntelligence, KamosTaxImplication, KamosRecipientIntelligence,
  KamosOnboardingWorkflow, KamosFinancialIntelligence, KamosPredictedActivity,
  KamosWalletSuggestion, KamosFraudIntelligence, KamosFraudRecommendation,
  KamosTransactionIntelligence, KamosTransferOrchestration, KamosOrchestrationStep,
  KamosTransferResult, KamosPluginCapability,
  buildUserContextVector, buildTransactionContextVector,
} from './asis-wallet-types';

export class ASISWalletIntelligence {
  private supabase: SupabaseClient<Database>;
  private plugins: Map<string, KamosPluginCapability> = new Map();
  private entityCache: Map<string, { entity: KamosEntity; expires: number }> = new Map();
  private fieldCache: Map<string, { field: KamosField; expires: number }> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.registerDefaultPlugins();
  }

  // ==========================================================================
  // 1. USER INTELLIGENCE
  // ==========================================================================

  async analyzeUser(profileId: string): Promise<KamosUserProfile> {
    const cacheKey = `user_intel_${profileId}`;
    const cached = this.getEntityCache(cacheKey);
    if (cached) return this.entityToUserProfile(cached, profileId);

    const { data: profile } = await this.supabase
      .from('profiles').select('*').eq('id', profileId).single();

    if (!profile) {
      const entity = this.createUnknownEntity();
      this.setEntityCache(cacheKey, entity, 300);
      return this.entityToUserProfile(entity, profileId);
    }

    const createdAt = new Date(profile.created_at || Date.now());
    const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const { count: txCount } = await this.supabase
      .from('wallet_transactions').select('*', { count: 'exact', head: true }).eq('sender_id', profileId);

    const hasPreviousActivity = (txCount || 0) > 0;

    const { data: verifications } = await this.supabase
      .from('profile_verifications').select('status').eq('profile_id', profileId).eq('status', 'verified');

    const isVerified = (verifications?.length || 0) > 0;

    const { data: sessions } = await this.supabase
      .from('user_sessions').select('device_id, created_at').eq('profile_id', profileId)
      .order('created_at', { ascending: false }).limit(10);

    const deviceHistory = [...new Set(sessions?.map(s => s.device_id) || [])];
    const behaviourProfile = await this.buildKamosBehaviourProfile(profileId);
    const networkGraph = await this.buildKamosNetworkGraph(profileId);
    const contextVector = buildUserContextVector(profile, behaviourProfile, networkGraph);

    const entity: KamosEntity = {
      id: profileId,
      baseValue: profile.trust_score ? profile.trust_score / 100 : 0.5,
      growthFactor: hasPreviousActivity ? Math.min(1, accountAgeDays / 365) : 0.1,
      replicationRate: networkGraph.length > 0 ? Math.min(1, networkGraph.length / 100) : 0.05,
      interactionStrength: Math.min(1, (txCount || 0) / 1000),
      observationState: isVerified ? 0.9 : hasPreviousActivity ? 0.6 : 0.2,
      contextVector,
      entropy: behaviourProfile.entropyLevel,
    };

    this.setEntityCache(cacheKey, entity, 300);
    const userType = await this.determineUserType(profileId, profile);

    return {
      profileId, entity, userType,
      isNew: accountAgeDays < 7 && !hasPreviousActivity,
      isVerified, kycRequired: !isVerified && accountAgeDays > 30,
      hasPreviousActivity, accountAgeDays, deviceHistory,
      behaviourProfile, networkGraph,
    };
  }

  private createUnknownEntity(): KamosEntity {
    return {
      id: 'unknown', baseValue: 0.1, growthFactor: 0.1, replicationRate: 0.05,
      interactionStrength: 0.05, observationState: 0.1,
      contextVector: new Array(10).fill(0.1), entropy: 0.8,
    };
  }

  private entityToUserProfile(entity: KamosEntity, profileId: string): KamosUserProfile {
    return {
      profileId, entity,
      userType: 'unknown',
      isNew: entity.observationState < 0.3,
      isVerified: entity.observationState > 0.8,
      kycRequired: entity.observationState < 0.5 && entity.baseValue > 0.3,
      hasPreviousActivity: entity.interactionStrength > 0.1,
      accountAgeDays: Math.floor(entity.growthFactor * 365),
      deviceHistory: [],
      behaviourProfile: this.getDefaultKamosBehaviourProfile(),
      networkGraph: [],
    };
  }

  private async buildKamosBehaviourProfile(profileId: string): Promise<KamosBehaviourProfile> {
    const { data: transactions } = await this.supabase
      .from('wallet_transactions')
      .select('amount, created_at, recipient_id, device_id')
      .eq('sender_id', profileId)
      .order('created_at', { ascending: false }).limit(100);

    if (!transactions || transactions.length === 0) {
      return this.getDefaultKamosBehaviourProfile();
    }

    const amounts = transactions.map(t => t.amount);
    const avgTransactionSize = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const hours = transactions.map(t => new Date(t.created_at).getHours());
    const preferredTimes = [...new Set(hours)];

    const hourCounts = new Array(24).fill(0);
    hours.forEach(h => hourCounts[h]++);
    const temporalRhythm = hourCounts.map(c => c / (hours.length || 1));

    const recipientIds = transactions.map(t => t.recipient_id);
    const preferredRecipients = [...new Set(recipientIds)].filter(Boolean) as string[];

    const deviceIds = transactions.map(t => t.device_id).filter(Boolean);
    const uniqueDevices = [...new Set(deviceIds)];
    const deviceConsistency = deviceIds.length > 0 ? uniqueDevices.length / deviceIds.length : 1;

    const txCount = transactions.length;
    const daysSpan = Math.max(1, (new Date(transactions[0].created_at).getTime() - new Date(transactions[transactions.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24));
    const frequency = txCount / daysSpan;
    const transactionFrequency = frequency > 5 ? 'high' : frequency > 1 ? 'medium' : 'low';

    const amountBins = this.binAmounts(amounts, 10);
    const total = amounts.length;
    const entropy = -amountBins.reduce((sum, count) => {
      if (count === 0) return sum;
      const p = count / total;
      return sum + p * Math.log2(p);
    }, 0);
    const normalizedEntropy = Math.min(1, entropy / Math.log2(10));

    return {
      avgTransactionSize, transactionFrequency, preferredTimes, preferredRecipients,
      geographicPattern: 'stable', deviceConsistency, temporalRhythm, entropyLevel: normalizedEntropy,
    };
  }

  private binAmounts(amounts: number[], bins: number): number[] {
    if (amounts.length === 0) return new Array(bins).fill(0);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const range = max - min || 1;
    const result = new Array(bins).fill(0);
    amounts.forEach(a => {
      const bin = Math.min(bins - 1, Math.floor(((a - min) / range) * bins));
      result[bin]++;
    });
    return result;
  }

  private async buildKamosNetworkGraph(profileId: string): Promise<KamosNetworkNode[]> {
    const { data: connections } = await this.supabase
      .from('// STUB_REMOVED: "profile_connections"')
      .select('connected_profile_id, connection_type')
      .eq('profile_id', profileId).eq('status', 'active');

    const nodes: KamosNetworkNode[] = [];
    for (const conn of (connections || [])) {
      const { data: txData } = await this.supabase
        .from('wallet_transactions')
        .select('amount, created_at')
        .eq('sender_id', profileId).eq('recipient_id', conn.connected_profile_id)
        .order('created_at', { ascending: false }).limit(10);

      const txs = txData || [];
      const totalVolume = txs.reduce((sum, t) => sum + (t.amount || 0), 0);

      const { data: neighborProfile } = await this.supabase
        .from('profiles').select('trust_score').eq('id', conn.connected_profile_id).single();

      const resonanceScore = (neighborProfile?.trust_score || 50) / 100;
      const fieldContribution = totalVolume > 0 ? Math.log1p(totalVolume) / 10 : 0.05;

      nodes.push({
        profileId: conn.connected_profile_id, relationship: conn.connection_type as any,
        transactionCount: txs.length, totalVolume,
        lastInteraction: txs[0]?.created_at || '', resonanceScore, fieldContribution,
      });
    }
    return nodes;
  }

  private getDefaultKamosBehaviourProfile(): KamosBehaviourProfile {
    return {
      avgTransactionSize: 0, transactionFrequency: 'low', preferredTimes: [],
      preferredRecipients: [], geographicPattern: 'stable', deviceConsistency: 1,
      temporalRhythm: new Array(24).fill(0), entropyLevel: 1,
    };
  }

  private async determineUserType(profileId: string, profile: any): Promise<UserType> {
    const { data: business } = await this.supabase
      .from('// STUB_REMOVED: "profile_businesses"').select('id').eq('profile_id', profileId).single();
    if (business) return 'business';

    const { data: roles } = await this.supabase
      .from('profile_roles').select('role').eq('profile_id', profileId);
    const roleList = roles?.map(r => r.role) || [];
    if (roleList.includes('government')) return 'government';
    if (roleList.includes('merchant')) return 'merchant';
    if (roleList.includes('driver')) return 'driver';
    if (roleList.includes('school_admin')) return 'school';
    if (roleList.includes('hospital_admin')) return 'hospital';
    if (roleList.includes('restaurant_owner')) return 'restaurant';

    const createdAt = new Date(profile.created_at || Date.now());
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const { count } = await this.supabase
      .from('wallet_transactions').select('*', { count: 'exact', head: true }).eq('sender_id', profileId);
    if (ageDays < 7 && (count || 0) === 0) return 'new';
    return 'verified';
  }

  // ==========================================================================
  // 2. TRANSFER INTELLIGENCE
  // ==========================================================================

  async analyzeTransfer(request: KamosTransferRequest): Promise<KamosTransferIntelligence> {
    const senderIntel = await this.analyzeUser(request.senderProfileId);
    const recipientIntel = await this.detectRecipient(request.recipientIdentifier);
    const field = await this.buildTransferField(senderIntel, recipientIntel, request);
    const transferEntity = kamosMultiply(senderIntel.entity, recipientIntel.kamosEntity, field);
    const fraudIntel = await this.analyzeKamosFraud(request, senderIntel, recipientIntel, field);
    const complianceFlags = await this.checkCompliance(request, senderIntel, recipientIntel);
    const taxImplications = await this.calculateKamosTaxImplications(request, senderIntel, recipientIntel, transferEntity);

    let decision: TransferDecision = 'approve';
    let confidence = transferEntity.observationState;
    let requiresVerification = false;
    let requiresBiometric = false;
    let requiresEscrow = false;
    let requiresRecipientConfirmation = false;
    const recommendedLimit = transferEntity.baseValue * 10000;

    if (senderIntel.isNew && request.amount > 100) {
      decision = 'verify'; confidence = senderIntel.entity.observationState; requiresVerification = true;
    }

    if (fraudIntel.kamosAnomalyScore > 2.0) {
      decision = fraudIntel.kamosAnomalyScore > 3.0 ? 'reject' : 'review';
      confidence = 1 - fraudIntel.kamosAnomalyScore / 5;
      requiresEscrow = fraudIntel.kamosAnomalyScore > 2.5;
    }

    if (senderIntel.entity.observationState < 0.5 && request.amount > 500) {
      decision = 'biometric'; requiresBiometric = true; confidence = senderIntel.entity.observationState;
    }

    if (recipientIntel.recipientType === 'unknown') {
      requiresRecipientConfirmation = true;
      decision = decision === 'approve' ? 'notify' : decision;
    }

    if (recipientIntel.onboardingRequired) { requiresEscrow = true; decision = 'escrow'; }

    const { data: dailyTotal } = await this.supabase
      .from('wallet_transactions').select('amount')
      .eq('sender_id', request.senderProfileId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const dailyUsed = (dailyTotal || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    if (dailyUsed + request.amount > recommendedLimit) { decision = 'limit'; confidence = field.coherence; }

    const suggestedActions: string[] = [];
    if (requiresVerification) suggestedActions.push('Complete identity verification');
    if (requiresBiometric) suggestedActions.push('Biometric authentication required');
    if (requiresEscrow) suggestedActions.push('Funds held in escrow pending confirmation');
    if (recipientIntel.onboardingRequired) suggestedActions.push('Recipient onboarding initiated');
    if (complianceFlags.length > 0) suggestedActions.push(...complianceFlags);

    return {
      decision, confidence, riskLevel: fraudIntel.riskLevel, recommendedLimit,
      requiresVerification, requiresBiometric, requiresEscrow, requiresRecipientConfirmation,
      fraudScore: fraudIntel.riskScore, complianceFlags, taxImplications, suggestedActions,
      kamosFieldStrength: field.fieldStrength,
      kamosResonance: kamosResonance(senderIntel.entity, recipientIntel.kamosEntity),
    };
  }

  private async buildTransferField(sender: KamosUserProfile, recipient: KamosRecipientIntelligence, request: KamosTransferRequest): Promise<KamosField> {
    const entities = new Map<string, KamosEntity>();
    entities.set(sender.profileId, sender.entity);
    entities.set(recipient.profileId || 'unknown', recipient.kamosEntity);

    for (const node of sender.networkGraph) {
      const cached = this.getEntityCache(node.profileId);
      if (cached) entities.set(node.profileId, cached);
    }

    const field: KamosField = {
      entities,
      fieldStrength: (sender.entity.interactionStrength + recipient.kamosEntity.interactionStrength) / 2,
      resonance: kamosResonance(sender.entity, recipient.kamosEntity),
      coherence: 0.5,
    };
    field.coherence = kamosFieldCoherence(field);
    return field;
  }

  // ==========================================================================
  // 3. RECIPIENT DETECTION
  // ==========================================================================

  async detectRecipient(identifier: string): Promise<KamosRecipientIntelligence> {
    let profile = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(identifier)) {
      const { data } = await this.supabase.from('profiles').select('*').eq('id', identifier).single();
      profile = data;
    }
    if (!profile) {
      const { data } = await this.supabase.from('profiles').select('*').eq('username', identifier).single();
      profile = data;
    }
    if (!profile) {
      const normalizedPhone = identifier.replace(/[^\d+]/g, '');
      const { data } = await this.supabase.from('profiles').select('*').eq('phone', normalizedPhone).single();
      profile = data;
    }
    if (!profile && identifier.includes('@')) {
      const { data } = await this.supabase.from('profiles').select('*').eq('email', identifier).single();
      profile = data;
    }
    if (!profile && identifier.startsWith('MTAA-')) {
      const { data } = await this.supabase.from('profiles').select('*').eq('mtaa_id', identifier).single();
      profile = data;
    }

    if (profile) {
      const userType = await this.determineUserType(profile.id, profile);
      const { data: wallet } = await this.supabase.from('wallets').select('id').eq('profile_id', profile.id).single();
      const contextVector = buildUserContextVector(profile, this.getDefaultKamosBehaviourProfile(), []);
      const kamosEntity: KamosEntity = {
        id: profile.id, baseValue: (profile.trust_score || 50) / 100,
        growthFactor: 0.5, replicationRate: 0.3, interactionStrength: 0.4,
        observationState: profile.is_verified ? 0.9 : 0.5,
        contextVector, entropy: 0.3,
      };
      return {
        recipientType: userType, isRegistered: true, profileId: profile.id, walletId: wallet?.id,
        businessName: profile.business_name, onboardingRequired: false, onboardingWorkflow: null,
        preferredChannel: 'push', trustScore: profile.trust_score || 50, riskLevel: 'low',
        kamosEntity, fieldAlignment: 0.7,
      };
    }

    const claimToken = this.generateSecureToken();
    const kamosEntity: KamosEntity = {
      id: `pending_${claimToken}`, baseValue: 0.1, growthFactor: 0.8,
      replicationRate: 0.1, interactionStrength: 0.05, observationState: 0.05,
      contextVector: new Array(10).fill(0.1), entropy: 0.9,
    };

    const onboardingWorkflow: KamosOnboardingWorkflow = {
      claimToken, claimUrl: `https://mtaa.app/claim?token=${claimToken}`,
      qrCodeData: `MTAA-CLAIM:${claimToken}`, downloadLink: 'https://mtaa.app/download',
      smsSent: false, whatsappSent: false, emailSent: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      autoReleaseAfterVerification: true, kamosGrowthPotential: 0.8,
    };

    let preferredChannel: 'sms' | 'whatsapp' | 'email' | 'push' | 'qr' = 'sms';
    if (identifier.includes('@')) preferredChannel = 'email';

    return {
      recipientType: 'unknown', isRegistered: false, onboardingRequired: true,
      onboardingWorkflow, preferredChannel, trustScore: 0, riskLevel: 'medium',
      kamosEntity, fieldAlignment: 0.1,
    };
  }

  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  }

  // ==========================================================================
  // 4. ONBOARDING
  // ==========================================================================

  async initiateOnboarding(senderProfileId: string, recipientIdentifier: string, amount: number, currency: string): Promise<KamosOnboardingWorkflow> {
    const recipientIntel = await this.detectRecipient(recipientIdentifier);
    if (!recipientIntel.onboardingRequired || !recipientIntel.onboardingWorkflow) {
      throw new Error('Recipient already registered or onboarding not required');
    }
    const workflow = recipientIntel.onboardingWorkflow;

    const { data: pendingWallet } = await this.supabase.from('wallets').insert({
      profile_id: null, balance: 0, currency, status: 'pending',
      metadata: {
        claim_token: workflow.claimToken, sender_profile_id: senderProfileId,
        pending_amount: amount, expires_at: workflow.expiresAt,
        kamos_growth_potential: workflow.kamosGrowthPotential,
      },
    }).select().single();

    await this.supabase.from('wallet_transactions').insert({
      sender_id: senderProfileId, recipient_id: null, amount, currency,
      type: 'escrow', status: 'pending',
      metadata: { claim_token: workflow.claimToken, pending_wallet_id: pendingWallet?.id, recipient_identifier: recipientIdentifier, kamos_onboarding: true },
    });

    if (recipientIntel.preferredChannel === 'sms') {
      await this.sendSMS(recipientIdentifier, `You have received ${amount} ${currency} on MTAA! Claim: ${workflow.claimUrl}`);
      workflow.smsSent = true;
    }
    if (recipientIntel.preferredChannel === 'email') {
      await this.sendEmail(recipientIdentifier, { subject: `You received ${amount} ${currency}`, body: `<p>Claim: <a href="${workflow.claimUrl}">${workflow.claimUrl}</a></p>` });
      workflow.emailSent = true;
    }

    await this.supabase.from('profile_analytics').insert({
      profile_id: senderProfileId, date: new Date().toISOString().split('T')[0], onboarding_initiated: 1,
    });

    return workflow;
  }

  async completeOnboarding(claimToken: string, newProfileId: string): Promise<boolean> {
    const { data: pendingWallet } = await this.supabase
      .from('wallets').select('*').eq('status', 'pending')
      .filter('metadata->claim_token', 'eq', claimToken).single();
    if (!pendingWallet) return false;

    const metadata = pendingWallet.metadata as any;
    await this.supabase.from('wallets').update({
      profile_id: newProfileId, status: 'active', balance: metadata.pending_amount,
    }).eq('id', pendingWallet.id);

    await this.supabase.from('wallet_transactions').update({
      recipient_id: newProfileId, status: 'completed', completed_at: new Date().toISOString(),
    }).eq('metadata->claim_token', claimToken);

    await this.notifyUser(metadata.sender_profile_id, {
      type: 'onboarding_complete', title: 'Transfer Complete',
      body: 'Your recipient has joined MTAA and received the funds.',
    });

    const newUserEntity: KamosEntity = {
      id: newProfileId, baseValue: 0.3, growthFactor: metadata.kamos_growth_potential || 0.8,
      replicationRate: 0.1, interactionStrength: 0.1, observationState: 0.3,
      contextVector: new Array(10).fill(0.3), entropy: 0.6,
    };
    this.setEntityCache(newProfileId, newUserEntity, 300);
    return true;
  }

  // ==========================================================================
  // 5. FINANCIAL INTELLIGENCE
  // ==========================================================================

  async analyzeFinancials(profileId: string): Promise<KamosFinancialIntelligence> {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: dailyTxs } = await this.supabase.from('wallet_transactions').select('amount').eq('sender_id', profileId).gte('created_at', dayStart);
    const dailyLimitUsed = (dailyTxs || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    const { data: monthlyTxs } = await this.supabase.from('wallet_transactions').select('amount, created_at, type')
      .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`).gte('created_at', monthStart);

    const monthlySent = (monthlyTxs || []).filter(t => t.type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthlyReceived = (monthlyTxs || []).filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);

    const { data: profile } = await this.supabase.from('profiles').select('trust_score, daily_limit, monthly_limit').eq('id', profileId).single();
    const dailyLimitTotal = profile?.daily_limit || (profile?.trust_score || 50) * 10;
    const monthlyLimitTotal = profile?.monthly_limit || (profile?.trust_score || 50) * 300;

    const { data: allTxs } = await this.supabase.from('wallet_transactions').select('created_at').eq('sender_id', profileId).order('created_at', { ascending: true }).limit(100);
    const txCount = allTxs?.length || 0;
    const firstTxDate = allTxs && allTxs.length > 0 ? new Date(allTxs[0].created_at) : now;
    const daysSinceFirst = Math.max(1, (now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
    const spendingVelocity = txCount / daysSinceFirst;

    const incomeTrend = monthlyReceived > monthlySent * 1.5 ? 'growing' : monthlyReceived < monthlySent ? 'declining' : 'stable';
    const savingsOpportunity = Math.max(0, monthlyReceived - monthlySent - (monthlyReceived * 0.2));
    const loanEligibility = (profile?.trust_score || 0) > 60 && monthlyReceived > 1000;
    const loanMaxAmount = loanEligibility ? monthlyReceived * 0.5 : 0;
    const investmentSuitability = (profile?.trust_score || 0) > 80 ? 'aggressive' : (profile?.trust_score || 0) > 50 ? 'moderate' : 'conservative';

    const userIntel = await this.analyzeUser(profileId);
    const behaviourAnomaly = spendingVelocity > 10 ? 'unusual_spike' : null;

    const predictedFutureActivity: KamosPredictedActivity[] = [];
    if (monthlyReceived > 0) {
      predictedFutureActivity.push({
        type: 'salary_credit', probability: 0.8, expectedAmount: monthlyReceived,
        expectedDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(), kamosResonance: 0.7,
      });
    }

    const financialField = await this.buildFinancialField(profileId);
    const kamosCoherence = kamosFieldCoherence(financialField);
    const kamosEntropy = userIntel.entity.entropy;
    const predictedEntity = kamosPredict(userIntel.entity, financialField, 30);
    const kamosGrowthTrajectory = predictedEntity.baseValue - userIntel.entity.baseValue;

    return {
      dailyLimitUsed, dailyLimitTotal, monthlyLimitUsed: monthlySent, monthlyLimitTotal,
      spendingVelocity, incomeTrend, savingsOpportunity, loanEligibility, loanMaxAmount,
      investmentSuitability, fraudProbability: userIntel.entity.entropy, behaviourAnomaly,
      predictedFutureActivity, kamosCoherence, kamosEntropy, kamosGrowthTrajectory,
    };
  }

  private async buildFinancialField(profileId: string): Promise<KamosField> {
    const { data: connections } = await this.supabase.from('// STUB_REMOVED: "profile_connections"').select('connected_profile_id').eq('profile_id', profileId).eq('status', 'active');
    const entities = new Map<string, KamosEntity>();
    const userIntel = await this.analyzeUser(profileId);
    entities.set(profileId, userIntel.entity);
    for (const conn of (connections || [])) {
      const cached = this.getEntityCache(conn.connected_profile_id);
      if (cached) entities.set(conn.connected_profile_id, cached);
    }
    return { entities, fieldStrength: userIntel.entity.interactionStrength, resonance: 0.5, coherence: kamosFieldCoherence({ entities, fieldStrength: 0.5, resonance: 0.5, coherence: 0.5 }) };
  }

  // ==========================================================================
  // 6. WALLET ASSISTANT
  // ==========================================================================

  async generateSuggestions(profileId: string): Promise<KamosWalletSuggestion[]> {
    const suggestions: KamosWalletSuggestion[] = [];
    const financials = await this.analyzeFinancials(profileId);
    const userIntel = await this.analyzeUser(profileId);

    if (!userIntel.isVerified) {
      suggestions.push({
        type: 'complete_kyc', priority: 'critical', title: 'Complete KYC Verification',
        description: 'Verify your identity to unlock higher limits and full features.',
        actionData: { screen: 'verification', params: {} }, estimatedValue: 0, confidence: 1.0, kamosEmergence: 0.9,
      });
    }

    const { data: wallet } = await this.supabase.from('wallets').select('balance').eq('profile_id', profileId).single();
    if ((wallet?.balance || 0) < 50) {
      suggestions.push({
        type: 'top_up', priority: 'high', title: 'Top Up Your Wallet',
        description: 'Your balance is running low. Add funds to continue using MTAA.',
        actionData: { screen: 'wallet_topup', params: {} }, estimatedValue: 100, confidence: 0.9, kamosEmergence: 0.7,
      });
    }

    if (financials.savingsOpportunity > 100) {
      suggestions.push({
        type: 'save_excess', priority: 'medium', title: 'Move Excess to Savings',
        description: `You have ${financials.savingsOpportunity.toFixed(2)} available to save this month.`,
        actionData: { screen: 'savings', params: { amount: financials.savingsOpportunity } },
        estimatedValue: financials.savingsOpportunity * 0.05, confidence: 0.85, kamosEmergence: 0.8,
      });
    }

    const { data: loans } = await this.supabase.from('credit_loans').select('outstanding_balance, due_date')
      .eq('profile_id', profileId).gt('outstanding_balance', 0).order('due_date', { ascending: true }).limit(1);
    if (loans && loans.length > 0) {
      suggestions.push({
        type: 'repay_loan', priority: 'high', title: 'Repay Loan',
        description: `Outstanding: ${loans[0].outstanding_balance}. Due: ${loans[0].due_date}`,
        actionData: { screen: 'loan_repay', params: { loanId: loans[0].id } },
        estimatedValue: 0, confidence: 0.95, kamosEmergence: 0.6,
      });
    }

    if (financials.dailyLimitUsed > financials.dailyLimitTotal * 0.8) {
      suggestions.push({
        type: 'budget_alert', priority: 'critical', title: 'Daily Limit Warning',
        description: `You've used ${((financials.dailyLimitUsed / financials.dailyLimitTotal) * 100).toFixed(0)}% of your daily limit.`,
        actionData: { screen: 'limits', params: {} }, estimatedValue: 0, confidence: 1.0, kamosEmergence: 0.5,
      });
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => {
      const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pd !== 0) return pd;
      return b.kamosEmergence - a.kamosEmergence;
    });
    return suggestions.slice(0, 5);
  }

  // ==========================================================================
  // 7. FRAUD INTELLIGENCE
  // ==========================================================================

  async analyzeKamosFraud(request: KamosTransferRequest, senderIntel: KamosUserProfile, recipientIntel: KamosRecipientIntelligence, field: KamosField): Promise<KamosFraudIntelligence> {
    const anomaly = kamosDetectAnomaly(senderIntel.entity, field);
    let deviceRisk = 0, behaviourRisk = 0, velocityRisk = 0, locationRisk = 0, identityMismatch = 0, networkAbuse = 0;
    let knownPatternMatch: string | null = null;

    if (request.deviceId) {
      const isKnownDevice = senderIntel.deviceHistory.includes(request.deviceId);
      deviceRisk = isKnownDevice ? 0 : 0.3;
      const { count: deviceAccounts } = await this.supabase.from('user_sessions').select('*', { count: 'exact', head: true }).eq('device_id', request.deviceId);
      if ((deviceAccounts || 0) > 3) { deviceRisk += 0.3; knownPatternMatch = 'multi_account_device'; }
    }

    if (request.amount > senderIntel.behaviourProfile.avgTransactionSize * 5) {
      behaviourRisk = 0.4; knownPatternMatch = 'amount_spike';
    }

    const { count: recentTxs } = await this.supabase.from('wallet_transactions').select('*', { count: 'exact', head: true })
      .eq('sender_id', request.senderProfileId).gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((recentTxs || 0) > 10) { velocityRisk = 0.5; knownPatternMatch = 'velocity_abuse'; }

    if (request.location) locationRisk = 0.1;
    if (!senderIntel.isVerified && request.amount > 100) identityMismatch = 0.2;

    const highRiskConnections = senderIntel.networkGraph.filter(n => n.resonanceScore < 0.3).length;
    if (highRiskConnections > 2) networkAbuse = 0.3;

    const kamosAnomalyScore = anomaly.anomalyScore;
    const riskScore = Math.min(1,
      deviceRisk * 0.2 + behaviourRisk * 0.2 + velocityRisk * 0.15 +
      locationRisk * 0.1 + identityMismatch * 0.1 + networkAbuse * 0.1 + kamosAnomalyScore * 0.15
    );

    const riskLevel: RiskLevel = riskScore > 0.8 ? 'critical' : riskScore > 0.6 ? 'high' : riskScore > 0.4 ? 'medium' : riskScore > 0.2 ? 'low' : 'none';

    const recommendations: KamosFraudRecommendation[] = [];
    if (riskLevel === 'critical') recommendations.push({ action: 'block', reason: 'Multiple high-risk indicators', confidence: 0.95, kamosResonance: 0.1 });
    else if (riskLevel === 'high') {
      recommendations.push({ action: 'review', reason: 'Elevated risk profile', confidence: 0.8, kamosResonance: 0.3 });
      recommendations.push({ action: 'escrow', reason: 'Hold funds for review', confidence: 0.75, kamosResonance: 0.4 });
    } else if (riskLevel === 'medium') recommendations.push({ action: 'verify', reason: 'Additional verification recommended', confidence: 0.7, kamosResonance: 0.6 });
    else recommendations.push({ action: 'allow', reason: 'Risk within acceptable range', confidence: 0.95, kamosResonance: 0.9 });

    return {
      riskScore, riskLevel, deviceRisk, behaviourRisk, velocityRisk, locationRisk,
      identityMismatch, networkAbuse, knownPatternMatch, recommendations,
      requiresAction: riskLevel !== 'none' && riskLevel !== 'low',
      kamosAnomalyScore, kamosFieldDeviation: anomaly.deviationVector,
    };
  }

  // ==========================================================================
  // 8. TRANSACTION INTELLIGENCE
  // ==========================================================================

  async analyzeTransaction(tx: any): Promise<KamosTransactionIntelligence> {
    const senderIntel = await this.analyzeUser(tx.sender_id);
    const recipientIntel = await this.detectRecipient(tx.recipient_id || tx.recipient_identifier);
    const field = await this.buildTransferField(senderIntel, recipientIntel, {
      senderProfileId: tx.sender_id, recipientIdentifier: tx.recipient_id, amount: tx.amount, currency: tx.currency, timestamp: new Date(tx.created_at).getTime(),
    });
    const fraudIntel = await this.analyzeKamosFraud(
      { senderProfileId: tx.sender_id, recipientIdentifier: tx.recipient_id || tx.recipient_identifier, amount: tx.amount, currency: tx.currency, timestamp: new Date(tx.created_at).getTime() },
      senderIntel, recipientIntel, field
    );

    let predictedIntent = 'personal_transfer';
    if (recipientIntel.recipientType === 'business') predictedIntent = 'business_payment';
    if (recipientIntel.recipientType === 'merchant') predictedIntent = 'merchant_purchase';
    if (recipientIntel.recipientType === 'government') predictedIntent = 'government_payment';
    if (tx.amount > 10000) predictedIntent = 'large_transfer';

    let businessClassification: string | null = null;
    if (recipientIntel.businessName) businessClassification = await this.classifyBusiness(recipientIntel.businessName);

    const { data: similarTxs } = await this.supabase.from('wallet_transactions').select('amount, created_at')
      .eq('sender_id', tx.sender_id).eq('recipient_id', tx.recipient_id).order('created_at', { ascending: false }).limit(10);

    const isRecurring = (similarTxs?.length || 0) >= 3;
    let recurringPattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null = null;
    if (isRecurring && similarTxs) {
      const intervals = [];
      for (let i = 1; i < similarTxs.length; i++) {
        intervals.push(new Date(similarTxs[i - 1].created_at).getTime() - new Date(similarTxs[i].created_at).getTime());
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const days = avgInterval / (1000 * 60 * 60 * 24);
      if (days < 2) recurringPattern = 'daily';
      else if (days < 10) recurringPattern = 'weekly';
      else if (days < 40) recurringPattern = 'monthly';
      else recurringPattern = 'yearly';
    }

    const taxCategory = this.classifyTax(tx, recipientIntel);
    const budgetCategory = this.classifyBudget(tx, recipientIntel);
    const complianceFlags = await this.checkCompliance(
      { senderProfileId: tx.sender_id, recipientIdentifier: tx.recipient_id, amount: tx.amount, currency: tx.currency, timestamp: Date.now() },
      senderIntel, recipientIntel
    );

    const txContextVector = buildTransactionContextVector(tx, senderIntel, recipientIntel);
    const txEntity: KamosEntity = {
      id: tx.id || `tx_${Date.now()}`, baseValue: tx.amount / 10000, growthFactor: 0.1,
      replicationRate: isRecurring ? 0.8 : 0.1,
      interactionStrength: senderIntel.entity.interactionStrength * recipientIntel.kamosEntity.interactionStrength,
      observationState: (senderIntel.entity.observationState + recipientIntel.kamosEntity.observationState) / 2,
      contextVector: txContextVector, entropy: fraudIntel.kamosAnomalyScore / 5,
    };

    const kamosEvolution = kamosPredict(txEntity, field, 7);

    return {
      riskScore: fraudIntel.riskScore, confidence: 0.85, predictedIntent, businessClassification,
      isRecurring, recurringPattern, taxCategory, budgetCategory,
      behaviourAnomaly: fraudIntel.knownPatternMatch, expectedFutureActivity: [], complianceFlags,
      kamosEntity: txEntity, kamosEvolution,
    };
  }

  private async classifyBusiness(businessName: string): Promise<string> {
    const lower = businessName.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe')) return 'food_service';
    if (lower.includes('shop') || lower.includes('store') || lower.includes('mart')) return 'retail';
    if (lower.includes('tech') || lower.includes('software') || lower.includes('it')) return 'technology';
    if (lower.includes('health') || lower.includes('medical') || lower.includes('clinic')) return 'healthcare';
    if (lower.includes('school') || lower.includes('education') || lower.includes('academy')) return 'education';
    if (lower.includes('transport') || lower.includes('taxi') || lower.includes('logistics')) return 'transport';
    return 'general';
  }

  private classifyTax(tx: any, recipientIntel: KamosRecipientIntelligence): string {
    if (recipientIntel.recipientType === 'business') return 'business_expense';
    if (tx.amount > 10000) return 'large_transfer_reportable';
    if (recipientIntel.recipientType === 'government') return 'tax_payment';
    return 'personal';
  }

  private classifyBudget(tx: any, recipientIntel: KamosRecipientIntelligence): string {
    if (recipientIntel.recipientType === 'business') return 'business';
    if (tx.amount < 50) return 'micro_expense';
    if (tx.amount < 200) return 'daily_expense';
    if (tx.amount < 1000) return 'medium_expense';
    return 'major_expense';
  }

  // ==========================================================================
  // 9. TRANSFER ORCHESTRATOR
  // ==========================================================================

  async orchestrateTransfer(request: KamosTransferRequest): Promise<KamosTransferOrchestration> {
    const senderIntel = await this.analyzeUser(request.senderProfileId);
    const recipientIntel = await this.detectRecipient(request.recipientIdentifier);
    const field = await this.buildTransferField(senderIntel, recipientIntel, request);

    const orchestration: KamosTransferOrchestration = {
      sequence: [], currentStep: 0, status: 'pending', result: null, kamosField: field,
    };

    const steps = [
      { name: 'Validate', subsystem: 'validation' }, { name: 'Identity', subsystem: 'identity' },
      { name: 'Fraud', subsystem: 'fraud' }, { name: 'Compliance', subsystem: 'compliance' },
      { name: 'Limits', subsystem: 'limits' }, { name: 'Taxes', subsystem: 'tax' },
      { name: 'Escrow', subsystem: 'escrow' }, { name: 'Notifications', subsystem: 'notification' },
      { name: 'Ledger', subsystem: 'ledger' }, { name: 'Analytics', subsystem: 'analytics' },
      { name: 'Audit', subsystem: 'audit' }, { name: 'Receipt', subsystem: 'receipt' },
    ];

    for (const step of steps) {
      orchestration.sequence.push({
        name: step.name, status: 'pending', subsystem: step.subsystem, data: {},
        kamosEntity: { id: `step_${step.name}`, baseValue: 0.5, growthFactor: 0.1, replicationRate: 0, interactionStrength: 0.1, observationState: 0.5, contextVector: new Array(10).fill(0.5), entropy: 0.3 },
      });
    }

    orchestration.status = 'in_progress';

    try {
      await this.executeKamosStep(orchestration, 0, async () => {
        if (!request.senderProfileId || !request.recipientIdentifier || request.amount <= 0) throw new Error('Invalid transfer request');
        return { valid: true };
      });

      await this.executeKamosStep(orchestration, 1, async () => ({ senderType: senderIntel.userType, verified: senderIntel.isVerified }));

      await this.executeKamosStep(orchestration, 2, async () => {
        const fraud = await this.analyzeKamosFraud(request, senderIntel, recipientIntel, field);
        if (fraud.riskLevel === 'critical') throw new Error(`Fraud risk critical: ${fraud.recommendations[0]?.reason}`);
        return { riskLevel: fraud.riskLevel, score: fraud.riskScore, kamosAnomaly: fraud.kamosAnomalyScore };
      });

      await this.executeKamosStep(orchestration, 3, async () => {
        const flags = await this.checkCompliance(request, senderIntel, recipientIntel);
        return { flags };
      });

      await this.executeKamosStep(orchestration, 4, async () => {
        const financials = await this.analyzeFinancials(request.senderProfileId);
        if (financials.dailyLimitUsed + request.amount > financials.dailyLimitTotal) throw new Error('Daily limit exceeded');
        return { withinLimits: true, kamosCoherence: financials.kamosCoherence };
      });

      await this.executeKamosStep(orchestration, 5, async () => {
        const taxes = await this.calculateKamosTaxImplications(request, senderIntel, recipientIntel, kamosMultiply(senderIntel.entity, recipientIntel.kamosEntity, field));
        return { taxes };
      });

      const transferIntel = await this.analyzeTransfer(request);
      if (transferIntel.requiresEscrow) {
        await this.executeKamosStep(orchestration, 6, async () => {
          const { data: escrow } = await this.supabase.from('wallet_escrows').insert({
            sender_id: request.senderProfileId, amount: request.amount, currency: request.currency,
            status: 'pending', metadata: request.metadata,
          }).select().single();
          return { escrowId: escrow?.id };
        });
      } else { orchestration.sequence[6].status = 'skipped'; }

      await this.executeKamosStep(orchestration, 8, async () => {
        const recipientId = recipientIntel.profileId || null;
        const { data: tx } = await this.supabase.from('wallet_transactions').insert({
          sender_id: request.senderProfileId, recipient_id: recipientId, amount: request.amount, currency: request.currency,
          type: transferIntel.requiresEscrow ? 'escrow' : 'transfer',
          status: transferIntel.requiresEscrow ? 'pending' : 'completed',
          metadata: {
            ...request.metadata, asis_decision: transferIntel.decision, asis_confidence: transferIntel.confidence,
            asis_risk_level: transferIntel.riskLevel, kamos_field_strength: transferIntel.kamosFieldStrength, kamos_resonance: transferIntel.kamosResonance,
          },
        }).select().single();

        if (!transferIntel.requiresEscrow) {
          await this.supabase.rpc('debit_wallet', { p_profile_id: request.senderProfileId, p_amount: request.amount });
          if (recipientId) await this.supabase.rpc('credit_wallet', { p_profile_id: recipientId, p_amount: request.amount });
        }
        return { transactionId: tx?.id };
      });

      await this.executeKamosStep(orchestration, 7, async () => {
        const notificationsSent: string[] = [];
        await this.notifyUser(request.senderProfileId, { type: 'transfer_sent', title: 'Transfer Sent', body: `You sent ${request.amount} ${request.currency}` });
        notificationsSent.push('sender');
        if (recipientIntel.profileId) {
          await this.notifyUser(recipientIntel.profileId, { type: 'transfer_received', title: 'Money Received', body: `You received ${request.amount} ${request.currency}` });
          notificationsSent.push('recipient');
        }
        return { notificationsSent };
      });

      await this.executeKamosStep(orchestration, 9, async () => {
        await this.logAnalytics(request.senderProfileId, 'transfer', { amount: request.amount, currency: request.currency, recipient_type: (await this.detectRecipient(request.recipientIdentifier)).recipientType });
        return { logged: true };
      });

      await this.executeKamosStep(orchestration, 10, async () => {
        const { data: audit } = await this.supabase.from('audit_logs').insert({
          actor_id: request.senderProfileId, action: 'transfer', resource_type: 'wallet_transaction',
          metadata: { amount: request.amount, currency: request.currency, recipient: request.recipientIdentifier, asis_decision: transferIntel.decision },
        }).select().single();
        return { auditTrailId: audit?.id };
      });

      await this.executeKamosStep(orchestration, 11, async () => {
        const { data: receipt } = await this.supabase.from('transaction_receipts').insert({
          transaction_id: orchestration.sequence[8].data.transactionId, sender_id: request.senderProfileId,
          amount: request.amount, currency: request.currency, status: 'generated',
        }).select().single();
        return { receiptId: receipt?.id };
      });

      orchestration.status = 'completed';
      orchestration.result = {
        success: true, transactionId: orchestration.sequence[8].data.transactionId,
        ledgerEntryId: orchestration.sequence[8].data.transactionId, receiptId: orchestration.sequence[11].data.receiptId,
        escrowId: orchestration.sequence[6].data.escrowId, notificationsSent: orchestration.sequence[7].data.notificationsSent,
        analyticsLogged: orchestration.sequence[9].data.logged, auditTrailId: orchestration.sequence[10].data.auditTrailId,
        kamosFieldState: field,
      };
    } catch (error: any) {
      orchestration.status = 'failed';
      orchestration.sequence[orchestration.currentStep].status = 'failed';
      orchestration.sequence[orchestration.currentStep].error = error.message;
      orchestration.result = { success: false, notificationsSent: [], analyticsLogged: false, auditTrailId: '', kamosFieldState: field };
    }

    return orchestration;
  }

  private async executeKamosStep(orchestration: KamosTransferOrchestration, stepIndex: number, fn: () => Promise<any>): Promise<void> {
    orchestration.currentStep = stepIndex;
    orchestration.sequence[stepIndex].status = 'running';
    try {
      const result = await fn();
      orchestration.sequence[stepIndex].data = result;
      orchestration.sequence[stepIndex].status = 'completed';
    } catch (error: any) {
      orchestration.sequence[stepIndex].status = 'failed';
      orchestration.sequence[stepIndex].error = error.message;
      throw error;
    }
  }

  // ==========================================================================
  // 10. PLUGIN ARCHITECTURE
  // ==========================================================================

  private registerDefaultPlugins(): void {
    this.plugins.set('mtaa_core', {
      name: 'MTAA Core Wallet', type: 'bank',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ZAR', 'GHS'],
      supportedJurisdictions: ['US', 'EU', 'UK', 'KE', 'NG', 'ZA', 'GH'],
      maxAmount: 100000, minAmount: 0.01, fees: { percentage: 0, fixed: 0 },
      settlementTime: 0, kycRequired: false, complianceLevel: 'standard',
      kamosEntity: { id: 'mtaa_core', baseValue: 1, growthFactor: 0.9, replicationRate: 0.8, interactionStrength: 0.9, observationState: 0.95, contextVector: new Array(10).fill(0.9), entropy: 0.05 },
    });

    this.plugins.set('binance', {
      name: 'Binance Crypto', type: 'crypto',
      supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC', 'BNB'], supportedJurisdictions: ['GLOBAL'],
      maxAmount: 1000000, minAmount: 10, fees: { percentage: 0.001, fixed: 0 },
      settlementTime: 600, kycRequired: true, complianceLevel: 'enhanced',
      kamosEntity: { id: 'binance', baseValue: 0.8, growthFactor: 0.7, replicationRate: 0.6, interactionStrength: 0.7, observationState: 0.8, contextVector: new Array(10).fill(0.7), entropy: 0.2 },
    });

    this.plugins.set('stripe', {
      name: 'Stripe Card Processing', type: 'card',
      supportedCurrencies: ['USD', 'EUR', 'GBP'], supportedJurisdictions: ['US', 'EU', 'UK', 'CA', 'AU'],
      maxAmount: 50000, minAmount: 0.5, fees: { percentage: 0.029, fixed: 0.3 },
      settlementTime: 86400, kycRequired: true, complianceLevel: 'pci_dss',
      kamosEntity: { id: 'stripe', baseValue: 0.7, growthFactor: 0.6, replicationRate: 0.5, interactionStrength: 0.6, observationState: 0.85, contextVector: new Array(10).fill(0.6), entropy: 0.15 },
    });

    this.plugins.set('visa_direct', {
      name: 'Visa Direct', type: 'card',
      supportedCurrencies: ['USD', 'EUR', 'GBP'], supportedJurisdictions: ['GLOBAL'],
      maxAmount: 25000, minAmount: 1, fees: { percentage: 0.015, fixed: 0 },
      settlementTime: 30, kycRequired: true, complianceLevel: 'enhanced',
      kamosEntity: { id: 'visa_direct', baseValue: 0.75, growthFactor: 0.65, replicationRate: 0.55, interactionStrength: 0.65, observationState: 0.82, contextVector: new Array(10).fill(0.65), entropy: 0.18 },
    });

    this.plugins.set('mastercard_send', {
      name: 'Mastercard Send', type: 'card',
      supportedCurrencies: ['USD', 'EUR', 'GBP'], supportedJurisdictions: ['GLOBAL'],
      maxAmount: 25000, minAmount: 1, fees: { percentage: 0.015, fixed: 0 },
      settlementTime: 30, kycRequired: true, complianceLevel: 'enhanced',
      kamosEntity: { id: 'mastercard_send', baseValue: 0.75, growthFactor: 0.65, replicationRate: 0.55, interactionStrength: 0.65, observationState: 0.82, contextVector: new Array(10).fill(0.65), entropy: 0.18 },
    });

    this.plugins.set('stablecoin_usdc', {
      name: 'USDC Stablecoin', type: 'crypto',
      supportedCurrencies: ['USDC'], supportedJurisdictions: ['GLOBAL'],
      maxAmount: 1000000, minAmount: 1, fees: { percentage: 0.0001, fixed: 0 },
      settlementTime: 60, kycRequired: false, complianceLevel: 'standard',
      kamosEntity: { id: 'stablecoin_usdc', baseValue: 0.85, growthFactor: 0.7, replicationRate: 0.6, interactionStrength: 0.7, observationState: 0.9, contextVector: new Array(10).fill(0.7), entropy: 0.1 },
    });

    this.plugins.set('cross_border_ach', {
      name: 'Cross-Border ACH', type: 'cross_border',
      supportedCurrencies: ['USD', 'EUR', 'GBP'], supportedJurisdictions: ['US', 'EU', 'UK', 'CA'],
      maxAmount: 10000, minAmount: 100, fees: { percentage: 0.005, fixed: 5 },
      settlementTime: 172800, kycRequired: true, complianceLevel: 'enhanced',
      kamosEntity: { id: 'cross_border_ach', baseValue: 0.6, growthFactor: 0.5, replicationRate: 0.4, interactionStrength: 0.5, observationState: 0.75, contextVector: new Array(10).fill(0.5), entropy: 0.25 },
    });

    this.plugins.set('offline_mtaa', {
      name: 'MTAA Offline Transfer', type: 'offline',
      supportedCurrencies: ['USD', 'KES', 'NGN', 'ZAR', 'GHS'], supportedJurisdictions: ['KE', 'NG', 'ZA', 'GH'],
      maxAmount: 500, minAmount: 1, fees: { percentage: 0, fixed: 0 },
      settlementTime: 0, kycRequired: false, complianceLevel: 'basic',
      kamosEntity: { id: 'offline_mtaa', baseValue: 0.5, growthFactor: 0.4, replicationRate: 0.3, interactionStrength: 0.4, observationState: 0.5, contextVector: new Array(10).fill(0.4), entropy: 0.4 },
    });

    this.plugins.set('government_disbursement', {
      name: 'Government Disbursement', type: 'government',
      supportedCurrencies: ['USD', 'KES', 'NGN', 'ZAR', 'GHS'], supportedJurisdictions: ['KE', 'NG', 'ZA', 'GH'],
      maxAmount: 1000000, minAmount: 0, fees: { percentage: 0, fixed: 0 },
      settlementTime: 0, kycRequired: true, complianceLevel: 'government',
      kamosEntity: { id: 'government_disbursement', baseValue: 0.9, growthFactor: 0.8, replicationRate: 0.7, interactionStrength: 0.8, observationState: 0.95, contextVector: new Array(10).fill(0.8), entropy: 0.05 },
    });

    this.plugins.set('aid_distribution', {
      name: 'Aid Distribution', type: 'government',
      supportedCurrencies: ['USD', 'KES', 'NGN', 'ZAR', 'GHS'], supportedJurisdictions: ['KE', 'NG', 'ZA', 'GH'],
      maxAmount: 50000, minAmount: 0, fees: { percentage: 0, fixed: 0 },
      settlementTime: 0, kycRequired: false, complianceLevel: 'humanitarian',
      kamosEntity: { id: 'aid_distribution', baseValue: 0.8, growthFactor: 0.7, replicationRate: 0.6, interactionStrength: 0.7, observationState: 0.85, contextVector: new Array(10).fill(0.7), entropy: 0.15 },
    });
  }

  registerPlugin(id: string, capability: KamosPluginCapability): void { this.plugins.set(id, capability); }
  getPlugin(id: string): KamosPluginCapability | undefined { return this.plugins.get(id); }
  getPluginsByType(type: KamosPluginCapability['type']): KamosPluginCapability[] { return Array.from(this.plugins.values()).filter(p => p.type === type); }

  getBestPluginForTransfer(request: KamosTransferRequest): KamosPluginCapability | null {
    const candidates = Array.from(this.plugins.values()).filter(p =>
      p.supportedCurrencies.includes(request.currency) && request.amount >= p.minAmount && request.amount <= p.maxAmount
    );
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => {
      const costA = request.amount * a.fees.percentage + a.fees.fixed + a.settlementTime * 0.001;
      const costB = request.amount * b.fees.percentage + b.fees.fixed + b.settlementTime * 0.001;
      return costA - costB;
    })[0];
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private async checkCompliance(request: KamosTransferRequest, senderIntel: KamosUserProfile, recipientIntel: KamosRecipientIntelligence): Promise<string[]> {
    const flags: string[] = [];
    if (request.amount > 10000) flags.push('large_transfer_reporting');
    if (!senderIntel.isVerified && request.amount > 1000) flags.push('unverified_large_transfer');
    if (recipientIntel.recipientType === 'government') flags.push('government_payment');
    if (request.currency !== 'USD' && request.amount > 5000) flags.push('foreign_currency_reporting');
    const sanctioned = await this.checkSanctionsList(request.recipientIdentifier);
    if (sanctioned) flags.push('// STUB_REMOVED: "sanctions_list"_match');
    return flags;
  }

  private async calculateKamosTaxImplications(request: KamosTransferRequest, senderIntel: KamosUserProfile, recipientIntel: KamosRecipientIntelligence, transferEntity: KamosEntity): Promise<KamosTaxImplication[]> {
    const implications: KamosTaxImplication[] = [];
    if (request.amount > 10000) {
      implications.push({ type: 'income_reporting', jurisdiction: 'default', estimatedAmount: request.amount * 0.2, reportingRequired: true, kamosImpact: transferEntity.baseValue * 0.1 });
    }
    if (recipientIntel.recipientType === 'business') {
      implications.push({ type: 'business_expense', jurisdiction: 'default', estimatedAmount: 0, reportingRequired: true, kamosImpact: transferEntity.baseValue * 0.05 });
    }
    return implications;
  }

  private async checkSanctionsList(identifier: string): Promise<boolean> {
    // Would check against sanctions database
    return false;
  }

  private async sendSMS(to: string, message: string): Promise<void> {
    // Would integrate with SMS provider
  }

  private async sendWhatsApp(to: string, message: string): Promise<void> {
    // Would integrate with WhatsApp Business API
  }

  private async sendEmail(to: string, content: { subject: string; body: string }): Promise<void> {
    // Would integrate with email provider
  }

  private async notifyUser(profileId: string, notification: { type: string; title: string; body: string }): Promise<void> {
    await this.supabase.from('notifications').insert({
      profile_id: profileId, type: notification.type, title: notification.title, body: notification.body, read: false,
    });
  }

  private async logAnalytics(profileId: string, event: string, data: Record<string, any>): Promise<void> {
    await this.supabase.from('profile_analytics').insert({
      profile_id: profileId, date: new Date().toISOString().split('T')[0], [event]: 1, metadata: data,
    });
  }

  private getEntityCache(key: string): KamosEntity | null {
    const cached = this.entityCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.entity;
    this.entityCache.delete(key);
    return null;
  }

  private setEntityCache(key: string, entity: KamosEntity, ttlSeconds: number): void {
    this.entityCache.set(key, { entity, expires: Date.now() + ttlSeconds * 1000 });
  }

  private getFieldCache(key: string): KamosField | null {
    const cached = this.fieldCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.field;
    this.fieldCache.delete(key);
    return null;
  }

  private setFieldCache(key: string, field: KamosField, ttlSeconds: number): void {
    this.fieldCache.set(key, { field, expires: Date.now() + ttlSeconds * 1000 });
  }
}

export default ASISWalletIntelligence;
