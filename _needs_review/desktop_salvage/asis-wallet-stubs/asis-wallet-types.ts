// ============================================================================
// ASIS WALLET INTELLIGENCE — KAMOS-ALIGNED TYPES
// ============================================================================

import { KamosEntity, KamosField } from './kamos-theory';

export type UserType = 'new' | 'verified' | 'unverified' | 'suspended' | 'business' | 'merchant' | 'government' | 'school' | 'hospital' | 'driver' | 'restaurant' | 'unknown';

export type TransferDecision = 'approve' | 'reject' | 'review' | 'verify' | 'biometric' | 'escrow' | 'limit' | 'notify';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface KamosUserProfile {
  profileId: string;
  entity: KamosEntity;
  userType: UserType;
  isNew: boolean;
  isVerified: boolean;
  kycRequired: boolean;
  hasPreviousActivity: boolean;
  accountAgeDays: number;
  deviceHistory: string[];
  behaviourProfile: KamosBehaviourProfile;
  networkGraph: KamosNetworkNode[];
}

export interface KamosBehaviourProfile {
  avgTransactionSize: number;
  transactionFrequency: 'low' | 'medium' | 'high';
  preferredTimes: number[];
  preferredRecipients: string[];
  geographicPattern: 'stable' | 'traveling' | 'suspicious';
  deviceConsistency: number;
  temporalRhythm: number[];
  entropyLevel: number;
}

export interface KamosNetworkNode {
  profileId: string;
  relationship: 'family' | 'business' | 'merchant' | 'government' | 'unknown';
  transactionCount: number;
  totalVolume: number;
  lastInteraction: string;
  resonanceScore: number;
  fieldContribution: number;
}

export interface KamosTransferRequest {
  senderProfileId: string;
  recipientIdentifier: string;
  amount: number;
  currency: string;
  purpose?: string;
  metadata?: Record<string, any>;
  deviceId?: string;
  location?: { lat: number; lng: number };
  biometricVerified?: boolean;
  timestamp: number;
}

export interface KamosTransferIntelligence {
  decision: TransferDecision;
  confidence: number;
  riskLevel: RiskLevel;
  recommendedLimit: number;
  requiresVerification: boolean;
  requiresBiometric: boolean;
  requiresEscrow: boolean;
  requiresRecipientConfirmation: boolean;
  fraudScore: number;
  complianceFlags: string[];
  taxImplications: KamosTaxImplication[];
  suggestedActions: string[];
  kamosFieldStrength: number;
  kamosResonance: number;
}

export interface KamosTaxImplication {
  type: string;
  jurisdiction: string;
  estimatedAmount: number;
  reportingRequired: boolean;
  kamosImpact: number;
}

export interface KamosRecipientIntelligence {
  recipientType: UserType;
  isRegistered: boolean;
  profileId?: string;
  walletId?: string;
  businessName?: string;
  governmentEntity?: string;
  onboardingRequired: boolean;
  onboardingWorkflow: KamosOnboardingWorkflow | null;
  preferredChannel: 'sms' | 'whatsapp' | 'email' | 'push' | 'qr';
  trustScore: number;
  riskLevel: RiskLevel;
  kamosEntity: KamosEntity;
  fieldAlignment: number;
}

export interface KamosOnboardingWorkflow {
  claimToken: string;
  claimUrl: string;
  qrCodeData: string;
  downloadLink: string;
  smsSent: boolean;
  whatsappSent: boolean;
  emailSent: boolean;
  expiresAt: string;
  autoReleaseAfterVerification: boolean;
  kamosGrowthPotential: number;
}

export interface KamosFinancialIntelligence {
  dailyLimitUsed: number;
  dailyLimitTotal: number;
  monthlyLimitUsed: number;
  monthlyLimitTotal: number;
  spendingVelocity: number;
  incomeTrend: 'growing' | 'stable' | 'declining';
  savingsOpportunity: number;
  loanEligibility: boolean;
  loanMaxAmount: number;
  investmentSuitability: 'conservative' | 'moderate' | 'aggressive';
  fraudProbability: number;
  behaviourAnomaly: string | null;
  predictedFutureActivity: KamosPredictedActivity[];
  kamosCoherence: number;
  kamosEntropy: number;
  kamosGrowthTrajectory: number;
}

export interface KamosPredictedActivity {
  type: string;
  probability: number;
  expectedAmount: number;
  expectedDate: string;
  kamosResonance: number;
}

export interface KamosWalletSuggestion {
  type: 'pay_invoice' | 'split_bill' | 'save_excess' | 'repay_loan' | 'accept_escrow' | 'withdraw' | 'convert_currency' | 'request_payment' | 'top_up' | 'complete_kyc' | 'update_verification' | 'invest' | 'insure' | 'budget_alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionData: Record<string, any>;
  estimatedValue: number;
  confidence: number;
  kamosEmergence: number;
}

export interface KamosFraudIntelligence {
  riskScore: number;
  riskLevel: RiskLevel;
  deviceRisk: number;
  behaviourRisk: number;
  velocityRisk: number;
  locationRisk: number;
  identityMismatch: number;
  networkAbuse: number;
  knownPatternMatch: string | null;
  recommendations: KamosFraudRecommendation[];
  requiresAction: boolean;
  kamosAnomalyScore: number;
  kamosFieldDeviation: number[];
}

export interface KamosFraudRecommendation {
  action: 'allow' | 'block' | 'review' | 'verify' | 'notify' | 'escrow';
  reason: string;
  confidence: number;
  kamosResonance: number;
}

export interface KamosTransactionIntelligence {
  riskScore: number;
  confidence: number;
  predictedIntent: string;
  businessClassification: string | null;
  isRecurring: boolean;
  recurringPattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  taxCategory: string;
  budgetCategory: string;
  behaviourAnomaly: string | null;
  expectedFutureActivity: KamosPredictedActivity[];
  complianceFlags: string[];
  kamosEntity: KamosEntity;
  kamosEvolution: KamosEntity;
}

export interface KamosTransferOrchestration {
  sequence: KamosOrchestrationStep[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result: KamosTransferResult | null;
  kamosField: KamosField;
}

export interface KamosOrchestrationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  subsystem: string;
  data: Record<string, any>;
  error?: string;
  kamosEntity: KamosEntity;
}

export interface KamosTransferResult {
  success: boolean;
  transactionId?: string;
  ledgerEntryId?: string;
  receiptId?: string;
  escrowId?: string;
  notificationsSent: string[];
  analyticsLogged: boolean;
  auditTrailId: string;
  kamosFieldState: KamosField;
}

export interface KamosPluginCapability {
  name: string;
  type: 'bank' | 'crypto' | 'card' | 'government' | 'merchant' | 'offline' | 'cross_border';
  supportedCurrencies: string[];
  supportedJurisdictions: string[];
  maxAmount: number;
  minAmount: number;
  fees: { percentage: number; fixed: number };
  settlementTime: number;
  kycRequired: boolean;
  complianceLevel: string;
  kamosEntity: KamosEntity;
}

// ============================================================================
// CONTEXT VECTOR BUILDERS
// ============================================================================

/**
 * Context Vector Dimensions:
 * [0] = Financial activity level (0-1)
 * [1] = Social connectivity (0-1)
 * [2] = Verification depth (0-1)
 * [3] = Temporal consistency (0-1)
 * [4] = Geographic stability (0-1)
 * [5] = Device loyalty (0-1)
 * [6] = Transaction pattern regularity (0-1)
 * [7] = Network trust density (0-1)
 * [8] = Behavioural entropy (0-1, inverted)
 * [9] = Growth trajectory (0-1)
 */
export function buildUserContextVector(profile: any, behaviour: KamosBehaviourProfile, network: KamosNetworkNode[]): number[] {
  return [
    Math.min(1, (profile.transaction_count || 0) / 100),
    Math.min(1, network.length / 50),
    profile.is_verified ? 1 : profile.kyc_level ? 0.5 : 0,
    behaviour.deviceConsistency,
    behaviour.geographicPattern === 'stable' ? 1 : 0.3,
    Math.min(1, behaviour.deviceConsistency),
    behaviour.transactionFrequency === 'high' ? 1 : behaviour.transactionFrequency === 'medium' ? 0.6 : 0.2,
    Math.min(1, network.reduce((sum, n) => sum + n.resonanceScore, 0) / (network.length || 1)),
    1 - behaviour.entropyLevel,
    Math.min(1, profile.trust_score ? profile.trust_score / 100 : 0.5),
  ];
}

export function buildTransactionContextVector(tx: any, sender: KamosUserProfile, recipient: KamosRecipientIntelligence): number[] {
  return [
    Math.min(1, tx.amount / 10000),
    sender.networkGraph.some(n => n.profileId === recipient.profileId) ? 1 : 0,
    sender.isVerified ? 1 : 0,
    recipient.isRegistered ? 1 : 0,
    Math.min(1, tx.amount / (sender.behaviourProfile.avgTransactionSize || 1)),
    recipient.recipientType === 'business' ? 1 : 0,
    tx.currency === 'USD' ? 1 : 0.5,
    new Date(tx.timestamp || Date.now()).getHours() >= 6 && new Date(tx.timestamp || Date.now()).getHours() <= 22 ? 1 : 0.3,
    sender.behaviourProfile.transactionFrequency === 'high' ? 1 : 0.5,
    recipient.trustScore / 100,
  ];
}
