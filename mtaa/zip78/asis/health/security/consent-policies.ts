import { HealthCategory, AccessLevel } from '../types';
export interface ConsentPolicy { id: string; name: string; description: string; categories: HealthCategory[]; accessLevel: AccessLevel; maxDurationMinutes: number; requireBiometric: boolean; requirePIN: boolean; allowEmergencyOverride: boolean; singleUse: boolean; autoRevokeOnSessionEnd: boolean; }

export const DEFAULT_POLICIES: ConsentPolicy[] = [
  { id: 'policy_standard_read', name: 'Standard Read', description: 'Read-only to standard categories', categories: ['medical_history', 'visits', 'immunizations'], accessLevel: 'read', maxDurationMinutes: 60, requireBiometric: false, requirePIN: true, allowEmergencyOverride: false, singleUse: false, autoRevokeOnSessionEnd: true },
  { id: 'policy_full_access', name: 'Full Access', description: 'Read+write to all categories', categories: ['medical_history', 'prescriptions', 'visits', 'lab_results', 'immunizations', 'allergies'], accessLevel: 'write', maxDurationMinutes: 120, requireBiometric: true, requirePIN: true, allowEmergencyOverride: false, singleUse: false, autoRevokeOnSessionEnd: true },
  { id: 'policy_emergency', name: 'Emergency', description: 'Emergency read, limited categories', categories: ['medical_history', 'allergies', 'emergency_contacts'], accessLevel: 'emergency_read', maxDurationMinutes: 120, requireBiometric: false, requirePIN: false, allowEmergencyOverride: true, singleUse: true, autoRevokeOnSessionEnd: true },
  { id: 'policy_single_use', name: 'Single-Use', description: 'One-time access, auto-revokes', categories: ['medical_history', 'prescriptions'], accessLevel: 'read', maxDurationMinutes: 30, requireBiometric: false, requirePIN: true, allowEmergencyOverride: false, singleUse: true, autoRevokeOnSessionEnd: true },
];

export class ConsentPolicies {
  private policies: Map<string, ConsentPolicy> = new Map();
  constructor() { DEFAULT_POLICIES.forEach(p => this.policies.set(p.id, p)); }
  getPolicy(id: string): ConsentPolicy | undefined { return this.policies.get(id); }
  getAllPolicies(): ConsentPolicy[] { return Array.from(this.policies.values()); }
  addPolicy(p: ConsentPolicy): void { this.policies.set(p.id, p); }
  removePolicy(id: string): boolean { return this.policies.delete(id); }
  getApplicablePolicies(categories: HealthCategory[], level: AccessLevel): ConsentPolicy[] { return this.getAllPolicies().filter(p => p.accessLevel === level && categories.every(c => p.categories.includes(c))); }
}
