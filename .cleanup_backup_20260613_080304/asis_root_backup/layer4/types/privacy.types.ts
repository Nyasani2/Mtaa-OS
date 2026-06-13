/**
 * ASIS Layer 4 — Privacy & Consent Types
 * User-owned data controls
 */

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING = 'pending',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export interface ConsentRecord {
  id: string;
  userId: string;
  scope: string;
  purpose: string;
  status: ConsentStatus;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  dataTypes: string[];
  agentTypes: string[];
  retentionDays: number;
  version: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  formats: ExportFormat[];
  scopes: string[];
  dateRange?: { from: Date; to: Date };
  downloadUrl?: string;
  expiresAt?: Date;
  sizeBytes?: number;
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  SQLITE = 'sqlite',
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scopes: string[];
  deleteType: 'soft' | 'hard' | 'anonymize';
  completedAt?: Date;
  deletedCount?: number;
}

export interface PrivacySettings {
  userId: string;
  autoDeleteDays: number;
  allowBehaviorTracking: boolean;
  allowSemanticMemory: boolean;
  allowPreferenceLearning: boolean;
  allowCrossDomainInference: boolean;
  minimumConsentLevel: ConsentStatus;
  exportEncryption: boolean;
  lastUpdated: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  scope: string;
  agentId?: string;
  dataAccessed?: string[];
  dataModified?: string[];
  consentId?: string;
  ipHash?: string;
  deviceHash?: string;
  success: boolean;
  details?: string;
}
