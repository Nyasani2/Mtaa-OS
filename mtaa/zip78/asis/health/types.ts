export type HealthCategory = 'medical_history' | 'prescriptions' | 'visits' | 'lab_results' | 'immunizations' | 'allergies' | 'emergency_contacts';
export type ConsentStatus = 'pending' | 'approved' | 'revoked' | 'expired' | 'emergency_override';
export type AccessLevel = 'read' | 'write' | 'emergency_read';
export type EmergencyFlag = 'none' | 'active' | 'resolved';

export interface HealthRecord {
  id: string; userId: string; category: HealthCategory; title: string;
  content: string; createdAt: string; updatedAt: string;
  source: 'user' | 'provider' | 'import'; providerId?: string;
  attachments?: string[]; isDeleted: boolean;
}

export interface ConsentToken {
  id: string; userId: string; requesterId: string; requesterName: string;
  accessLevel: AccessLevel; status: ConsentStatus; createdAt: string;
  expiresAt: string; approvedAt?: string; revokedAt?: string;
  categories: HealthCategory[]; pinVerified: boolean; biometricVerified: boolean;
  auditLogId: string;
}

export interface QRAccessSession {
  id: string; userId: string; providerId: string; qrCode: string;
  status: 'generated' | 'scanned' | 'approved' | 'active' | 'closed';
  createdAt: string; scannedAt?: string; approvedAt?: string; closedAt?: string;
  consentTokenId: string; recordsAccessed: string[];
}

export interface EmergencyAccessLog {
  id: string; userId: string; triggeredBy: string; reason: string;
  accessLevel: AccessLevel; status: EmergencyFlag; createdAt: string;
  resolvedAt?: string; trustedContactIds: string[]; recordsAccessed: string[];
}

export interface HealthProvider {
  id: string; name: string; type: 'hospital' | 'clinic' | 'doctor' | 'pharmacy';
  specialization?: string[];
  location: { lat: number; lng: number; address: string; city: string; country: string };
  contact: { phone: string; email?: string; website?: string };
  isVerified: boolean; availability?: { day: string; slots: string[] }[];
  rating?: number; languages?: string[];
}

export interface AuditEntry {
  id: string; timestamp: string; userId: string; actorId: string;
  actorType: 'user' | 'provider' | 'system' | 'asis'; action: string;
  recordId?: string; consentTokenId?: string;
  result: 'success' | 'denied' | 'error'; details: string;
  ipHash?: string; deviceHash?: string;
}
