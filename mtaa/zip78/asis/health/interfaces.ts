import { HealthRecord, ConsentToken, QRAccessSession, EmergencyAccessLog, HealthProvider, AuditEntry, HealthCategory, AccessLevel } from './types';

export interface IHealthVault {
  createRecord(userId: string, record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord>;
  getRecords(userId: string, categories?: HealthCategory[]): Promise<HealthRecord[]>;
  updateRecord(userId: string, recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord>;
  deleteRecord(userId: string, recordId: string): Promise<void>;
  exportData(userId: string): Promise<string>;
  purgeData(userId: string): Promise<void>;
}

export interface IConsentManager {
  requestAccess(requesterId: string, userId: string, categories: HealthCategory[], level: AccessLevel): Promise<ConsentToken>;
  approveConsent(userId: string, tokenId: string, pin: string): Promise<ConsentToken>;
  revokeConsent(userId: string, tokenId: string): Promise<ConsentToken>;
  checkAccess(tokenId: string, recordId: string): Promise<boolean>;
  listActiveConsents(userId: string): Promise<ConsentToken[]>;
  createEmergencyOverride(userId: string, reason: string): Promise<ConsentToken>;
}

export interface IRecordAccessGateway {
  requestAccessViaQR(userId: string, providerId: string): Promise<QRAccessSession>;
  scanQR(qrCode: string, providerId: string): Promise<QRAccessSession>;
  approveQRSession(userId: string, sessionId: string, pin: string): Promise<QRAccessSession>;
  closeSession(sessionId: string): Promise<void>;
  getSessionRecords(sessionId: string): Promise<HealthRecord[]>;
}

export interface IEmergencyAccess {
  activate(userId: string, triggeredBy: string, reason: string): Promise<EmergencyAccessLog>;
  resolve(userId: string, logId: string): Promise<EmergencyAccessLog>;
  getTrustedContacts(userId: string): Promise<string[]>;
  setTrustedContacts(userId: string, contactIds: string[]): Promise<void>;
  isEmergencyActive(userId: string): Promise<boolean>;
}

export interface IProviderDirectory {
  search(query: string, filters?: { type?: string; location?: string; specialization?: string }): Promise<HealthProvider[]>;
  getById(providerId: string): Promise<HealthProvider | null>;
  registerProvider(provider: Omit<HealthProvider, 'id'>): Promise<HealthProvider>;
  verifyProvider(providerId: string): Promise<HealthProvider>;
}

export interface IAuditLog {
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;
  getLogs(userId: string, options?: { from?: string; to?: string; actorType?: string }): Promise<AuditEntry[]>;
  getRecordAudit(recordId: string): Promise<AuditEntry[]>;
}
