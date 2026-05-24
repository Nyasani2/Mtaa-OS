/**
 * ASIS Configuration System
 * Environment-aware, country-profile driven, fintech-safe
 */

import { CountryProfile } from '../shared/types';

export interface SecurityConfig {
  requirePinForSensitiveActions: boolean;
  requireBiometricForCriticalActions: boolean;
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  auditLogRetentionDays: number;
  sessionTimeoutMs: number;
  encryptionKeyRotationDays: number;
}

export interface MemoryConfig {
  maxConversationHistory: number;
  embeddingDimension: number;
  semanticSearchThreshold: number;
  userMemoryTTLDays: number;
  anonymizationEnabled: boolean;
}

export interface ChatConfig {
  maxTokensPerResponse: number;
  streamingEnabled: boolean;
  typingIndicatorDelayMs: number;
  contextWindowSize: number;
  fallbackToLocalModel: boolean;
}

export interface AgentConfig {
  maxConcurrentAgents: number;
  agentTimeoutMs: number;
  reasoningDepth: 'shallow' | 'standard' | 'deep';
  toolUseEnabled: boolean;
}

export interface ASISConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  countryProfile: CountryProfile;
  security: SecurityConfig;
  memory: MemoryConfig;
  chat: ChatConfig;
  agent: AgentConfig;
  features: {
    voiceEnabled: boolean;
    avatarEnabled: boolean;
    studioEnabled: boolean;
    engineeringToolsEnabled: boolean;
    healthVaultEnabled: boolean;
    cashPointNetworkEnabled: boolean;
  };
  integrations: {
    walletServiceUrl: string;
    healthServiceUrl: string;
    transportServiceUrl: string;
    jobsServiceUrl: string;
    civicServiceUrl: string;
    messagingServiceUrl: string;
  };
  telemetry: {
    enabled: boolean;
    anonymizeIp: boolean;
    retentionDays: number;
  };
}

export const DEFAULT_COUNTRY_PROFILE: CountryProfile = {
  code: 'KE',
  name: 'Kenya',
  currency: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
  },
  taxRules: {
    vatRate: 0.16,
    withholdingTaxEnabled: true,
    digitalServicesTaxEnabled: false,
  },
  withdrawalMethods: ['mpesa', 'bank_transfer', 'cash_point', 'airtel_money'],
  kycRules: {
    tier1Limit: 300000,
    tier2Limit: 1000000,
    tier3Limit: Infinity,
    idRequired: true,
    addressVerificationRequired: true,
    biometricRequired: true,
  },
  complianceRules: {
    cbkRegulated: true,
    dataLocalizationRequired: true,
    transactionReportingThreshold: 100000,
  },
  locale: {
    language: 'en',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0.00',
  },
  emergencyNumbers: {
    police: '999',
    ambulance: '999',
    fire: '999',
  },
};

export const DEFAULT_CONFIG: ASISConfig = {
  version: '1.0.0',
  environment: 'development',
  countryProfile: DEFAULT_COUNTRY_PROFILE,
  security: {
    requirePinForSensitiveActions: true,
    requireBiometricForCriticalActions: true,
    maxFailedAttempts: 5,
    lockoutDurationMs: 900000,
    auditLogRetentionDays: 365,
    sessionTimeoutMs: 1800000,
    encryptionKeyRotationDays: 90,
  },
  memory: {
    maxConversationHistory: 50,
    embeddingDimension: 768,
    semanticSearchThreshold: 0.75,
    userMemoryTTLDays: 365,
    anonymizationEnabled: true,
  },
  chat: {
    maxTokensPerResponse: 2048,
    streamingEnabled: true,
    typingIndicatorDelayMs: 500,
    contextWindowSize: 8192,
    fallbackToLocalModel: true,
  },
  agent: {
    maxConcurrentAgents: 5,
    agentTimeoutMs: 30000,
    reasoningDepth: 'standard',
    toolUseEnabled: true,
  },
  features: {
    voiceEnabled: false,
    avatarEnabled: false,
    studioEnabled: false,
    engineeringToolsEnabled: false,
    healthVaultEnabled: false,
    cashPointNetworkEnabled: false,
  },
  integrations: {
    walletServiceUrl: '/api/wallet',
    healthServiceUrl: '/api/health',
    transportServiceUrl: '/api/transport',
    jobsServiceUrl: '/api/jobs',
    civicServiceUrl: '/api/civic',
    messagingServiceUrl: '/api/messaging',
  },
  telemetry: {
    enabled: true,
    anonymizeIp: true,
    retentionDays: 90,
  },
};

export function createConfig(partial?: Partial<ASISConfig>): ASISConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    security: { ...DEFAULT_CONFIG.security, ...partial?.security },
    memory: { ...DEFAULT_CONFIG.memory, ...partial?.memory },
    chat: { ...DEFAULT_CONFIG.chat, ...partial?.chat },
    agent: { ...DEFAULT_CONFIG.agent, ...partial?.agent },
    features: { ...DEFAULT_CONFIG.features, ...partial?.features },
    integrations: { ...DEFAULT_CONFIG.integrations, ...partial?.integrations },
    countryProfile: partial?.countryProfile || DEFAULT_COUNTRY_PROFILE,
  };
}
