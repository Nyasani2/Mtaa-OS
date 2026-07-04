import { supabase } from '@/lib/supabase';
import { HealthProfile, ChildHealthProfile, InsurancePolicy, EmergencyContact, SharePermission } from '../types';
import { getEmergencyData, updateEmergencyData } from '../security/emergency-card';

const TABLE_PROFILES = 'health_profiles';
const TABLE_CHILDREN = 'health_children';
const TABLE_SHARES = 'health_shares';

export async function getHealthProfile(mtaaId: string): Promise<HealthProfile | null> {
  const { data, error } = await supabase
    .from(TABLE_PROFILES)
    .select('*')
    .eq('mtaa_id', mtaaId)
    .single();
  if (error || !data) return null;
  return mapDbToProfile(data);
}

export async function createHealthProfile(profile: Omit<HealthProfile, 'createdAt' | 'updatedAt'>): Promise<HealthProfile | null> {
  const dbProfile = mapProfileToDb(profile);
  const { data, error } = await supabase.from(TABLE_PROFILES).insert(dbProfile).select().single();
  if (error || !data) return null;
  await updateEmergencyData({
    fullName: profile.fullName,
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    currentCriticalMedications: [],
    emergencyContacts: profile.emergencyContacts,
    organDonor: profile.organDonor,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });
  return mapDbToProfile(data);
}

export async function updateHealthProfile(mtaaId: string, updates: Partial<HealthProfile>): Promise<HealthProfile | null> {
  const dbUpdates = mapProfileToDb({ ...updates } as any);
  const { data, error } = await supabase
    .from(TABLE_PROFILES)
    .update(dbUpdates)
    .eq('mtaa_id', mtaaId)
    .select()
    .single();
  if (error || !data) return null;
  return mapDbToProfile(data);
}

export async function addInsurancePolicy(mtaaId: string, policy: Omit<InsurancePolicy, 'id'>): Promise<InsurancePolicy | null> {
  const profile = await getHealthProfile(mtaaId);
  if (!profile) return null;
  const newPolicy: InsurancePolicy = { ...policy, id: crypto.randomUUID() };
  const policies = [...profile.insurancePolicies, newPolicy];
  const updated = await updateHealthProfile(mtaaId, { insurancePolicies: policies });
  return updated ? newPolicy : null;
}

export async function removeInsurancePolicy(mtaaId: string, policyId: string): Promise<boolean> {
  const profile = await getHealthProfile(mtaaId);
  if (!profile) return false;
  const policies = profile.insurancePolicies.filter(p => p.id !== policyId);
  await updateHealthProfile(mtaaId, { insurancePolicies: policies });
  return true;
}

export async function getChildren(parentMtaaId: string): Promise<ChildHealthProfile[]> {
  const { data, error } = await supabase
    .from(TABLE_CHILDREN)
    .select('*')
    .eq('parent_mtaa_id', parentMtaaId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbToChildProfile);
}

export async function addChild(parentMtaaId: string, child: Omit<ChildHealthProfile, 'id' | 'parentMtaaId' | 'createdAt' | 'updatedAt'>): Promise<ChildHealthProfile | null> {
  const dbChild = {
    id: crypto.randomUUID(),
    parent_mtaa_id: parentMtaaId,
    full_name: child.fullName,
    date_of_birth: child.dateOfBirth,
    gender: child.gender,
    blood_group: child.bloodGroup,
    allergies: child.allergies,
    chronic_conditions: child.chronicConditions,
    height_cm: child.heightCm,
    weight_kg: child.weightKg,
    organ_donor: child.organDonor,
    emergency_contacts: child.emergencyContacts,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE_CHILDREN).insert(dbChild).select().single();
  if (error || !data) return null;
  return mapDbToChildProfile(data);
}

export async function updateChild(childId: string, updates: Partial<ChildHealthProfile>): Promise<ChildHealthProfile | null> {
  const dbUpdates: any = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.bloodGroup !== undefined) dbUpdates.blood_group = updates.bloodGroup;
  if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies;
  if (updates.chronicConditions !== undefined) dbUpdates.chronic_conditions = updates.chronicConditions;
  if (updates.heightCm !== undefined) dbUpdates.height_cm = updates.heightCm;
  if (updates.weightKg !== undefined) dbUpdates.weight_kg = updates.weightKg;
  if (updates.organDonor !== undefined) dbUpdates.organ_donor = updates.organDonor;
  if (updates.emergencyContacts !== undefined) dbUpdates.emergency_contacts = updates.emergencyContacts;
  if (updates.transferDate !== undefined) dbUpdates.transfer_date = updates.transferDate;
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_CHILDREN)
    .update(dbUpdates)
    .eq('id', childId)
    .select()
    .single();
  if (error || !data) return null;
  return mapDbToChildProfile(data);
}

export async function transferChildOwnership(childId: string, newMtaaId: string): Promise<boolean> {
  const child = await updateChild(childId, {
    transferDate: new Date().toISOString(),
    parentMtaaId: newMtaaId,
  });
  return !!child;
}

export async function getSharePermissions(patientId: string): Promise<SharePermission[]> {
  const { data, error } = await supabase
    .from(TABLE_SHARES)
    .select('*')
    .eq('patient_id', patientId)
    .order('granted_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbToShare);
}

export async function createSharePermission(
  patientId: string,
  hospitalId: string,
  hospitalName: string,
  scope: string[],
  expiryMinutes: number
): Promise<SharePermission | null> {
  const now = new Date();
  const expires = new Date(now.getTime() + expiryMinutes * 60000);
  const share = {
    id: crypto.randomUUID(),
    patient_id: patientId,
    hospital_id: hospitalId,
    hospital_name: hospitalName,
    scope,
    granted_at: now.toISOString(),
    expires_at: expires.toISOString(),
    status: 'active',
  };
  const { data, error } = await supabase.from(TABLE_SHARES).insert(share).select().single();
  if (error || !data) return null;
  return mapDbToShare(data);
}

export async function revokeSharePermission(shareId: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE_SHARES)
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', shareId);
  return !error;
}

function mapDbToProfile(row: any): HealthProfile {
  return {
    mtaaId: row.mtaa_id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodGroup: row.blood_group,
    organDonor: row.organ_donor,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    allergies: row.allergies || [],
    chronicConditions: row.chronic_conditions || [],
    emergencyContacts: row.emergency_contacts || [],
    insurancePolicies: row.insurance_policies || [],
    preferences: row.preferences || {
      notificationEnabled: true,
      autoShareWithPrimaryDoctor: false,
      medicationReminders: true,
      appointmentReminders: true,
    },
    primaryDoctorId: row.primary_doctor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileToDb(profile: any): any {
  return {
    mtaa_id: profile.mtaaId,
    full_name: profile.fullName,
    date_of_birth: profile.dateOfBirth,
    gender: profile.gender,
    blood_group: profile.bloodGroup,
    organ_donor: profile.organDonor,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    allergies: profile.allergies || [],
    chronic_conditions: profile.chronicConditions || [],
    emergency_contacts: profile.emergencyContacts || [],
    insurance_policies: profile.insurancePolicies || [],
    preferences: profile.preferences || {},
    primary_doctor_id: profile.primaryDoctorId,
    created_at: profile.createdAt || new Date().toISOString(),
    updated_at: profile.updatedAt || new Date().toISOString(),
  };
}

function mapDbToChildProfile(row: any): ChildHealthProfile {
  return {
    id: row.id,
    parentMtaaId: row.parent_mtaa_id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodGroup: row.blood_group,
    allergies: row.allergies || [],
    chronicConditions: row.chronic_conditions || [],
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    organDonor: row.organ_donor,
    emergencyContacts: row.emergency_contacts || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    transferDate: row.transfer_date,
  };
}

function mapDbToShare(row: any): SharePermission {
  return {
    id: row.id,
    patientId: row.patient_id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    scope: row.scope || [],
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    status: row.status,
  };
}
