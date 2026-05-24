import { HealthCategory, AccessLevel } from '../types';
export type PermissionAction = 'view_own' | 'edit_own' | 'share' | 'export' | 'delete' | 'emergency_access' | 'provider_read' | 'provider_write';
export interface PermissionRule { role: 'user' | 'provider' | 'trusted_contact' | 'asis' | 'emergency_system'; category: HealthCategory | '*'; level: AccessLevel; actions: PermissionAction[]; requiresConsent: boolean; requiresPIN: boolean; timeLimitMinutes?: number; }

export const DEFAULT_PERMISSIONS: PermissionRule[] = [
  { role: 'user', category: '*', level: 'read', actions: ['view_own', 'edit_own', 'share', 'export', 'delete'], requiresConsent: false, requiresPIN: false },
  { role: 'provider', category: '*', level: 'read', actions: ['provider_read'], requiresConsent: true, requiresPIN: true, timeLimitMinutes: 60 },
  { role: 'provider', category: '*', level: 'write', actions: ['provider_write'], requiresConsent: true, requiresPIN: true, timeLimitMinutes: 60 },
  { role: 'trusted_contact', category: 'emergency_contacts', level: 'read', actions: ['view_own'], requiresConsent: false, requiresPIN: true, timeLimitMinutes: 30 },
  { role: 'asis', category: '*', level: 'read', actions: [], requiresConsent: true, requiresPIN: true, timeLimitMinutes: 15 },
  { role: 'emergency_system', category: 'medical_history', level: 'emergency_read', actions: ['emergency_access'], requiresConsent: false, requiresPIN: false, timeLimitMinutes: 120 },
];

export class HealthPermissions {
  private rules: PermissionRule[] = [...DEFAULT_PERMISSIONS];
  can(role: PermissionRule['role'], action: PermissionAction, category: HealthCategory): boolean { return this.rules.some(r => (r.role === role || r.role === '*') && (r.category === category || r.category === '*') && r.actions.includes(action)); }
  requiresConsent(role: PermissionRule['role'], action: PermissionAction): boolean { return this.rules.find(r => r.role === role && r.actions.includes(action))?.requiresConsent ?? true; }
  requiresPIN(role: PermissionRule['role'], action: PermissionAction): boolean { return this.rules.find(r => r.role === role && r.actions.includes(action))?.requiresPIN ?? true; }
  getTimeLimit(role: PermissionRule['role'], action: PermissionAction): number { return this.rules.find(r => r.role === role && r.actions.includes(action))?.timeLimitMinutes ?? 60; }
}
