export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface InsurancePolicy {
  id: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  coverageType: 'inpatient' | 'outpatient' | 'comprehensive';
  validFrom: string;
  validUntil: string;
  coverageLimit: number;
  copayPercentage: number;
  isActive: boolean;
}

export interface HealthPreferences {
  defaultHospital?: string;
  defaultPharmacy?: string;
  notificationEnabled: boolean;
  autoShareWithPrimaryDoctor: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
}

export interface HealthProfile {
  mtaaId: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: BloodGroup;
  organDonor: boolean;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  insurancePolicies: InsurancePolicy[];
  preferences: HealthPreferences;
  primaryDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildHealthProfile {
  id: string;
  parentMtaaId: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: BloodGroup;
  allergies: string[];
  chronicConditions: string[];
  heightCm?: number;
  weightKg?: number;
  organDonor: boolean;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;
  transferDate?: string;
}

export interface SharePermission {
  id: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  scope: string[];
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
  status: 'active' | 'expired' | 'revoked';
}
