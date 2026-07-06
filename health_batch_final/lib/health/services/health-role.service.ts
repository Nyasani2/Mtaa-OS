import { supabase } from '@/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';

export interface HealthStaffRecord {
  id: string;
  user_id: string;
  facility_id: string | null;
  role: string;
  department: string | null;
  status: string;
  onboarding_status: string;
  is_on_duty: boolean;
  specialization: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  license_number: string | null;
  license_body: string | null;
  facility_name: string | null;
  facility_type: string | null;
  county: string | null;
  user_email: string | null;
  user_full_name: string | null;
  user_phone: string | null;
  user_avatar: string | null;
}

export interface StaffStats {
  active: number;
  pending: number;
  total: number;
}

export interface BiometricAuthResult {
  success: boolean;
  method: 'biometric' | 'pin' | 'cancelled' | 'unavailable';
  error?: string;
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  system_admin: 'System Admin',
  hospital_admin: 'Hospital Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  radiologist: 'Radiologist',
  cashier: 'Cashier',
  receptionist: 'Receptionist',
  hr_manager: 'HR Manager',
  accountant: 'Accountant',
  ambulance_dispatcher: 'Ambulance Dispatcher',
  patient: 'Patient',
};

export const ROLE_COLORS: Record<string, string> = {
  system_admin: '#8b5cf6',
  hospital_admin: '#3b82f6',
  doctor: '#0ea5e9',
  nurse: '#22c55e',
  pharmacist: '#f59e0b',
  lab_technician: '#ec4899',
  radiologist: '#14b8a6',
  cashier: '#f97316',
  receptionist: '#8b5cf6',
  hr_manager: '#ef4444',
  accountant: '#64748b',
  ambulance_dispatcher: '#ef4444',
  patient: '#94a3b8',
};

export const ROLE_ICONS: Record<string, string> = {
  system_admin: 'shield',
  hospital_admin: 'business',
  doctor: 'medical',
  nurse: 'heart',
  pharmacist: 'flask',
  lab_technician: 'beaker',
  radiologist: 'scan',
  cashier: 'cash',
  receptionist: 'people',
  hr_manager: 'person',
  accountant: 'calculator',
  ambulance_dispatcher: 'car',
  patient: 'person',
};

class HealthRoleService {
  async getPrimaryStaffRecord(userId: string): Promise<HealthStaffRecord | null> {
    const { data, error } = await supabase.rpc('health_get_primary_staff_record', { p_user_id: userId });
    if (error) {
      console.error('RPC error:', error);
      return null;
    }
    return data?.[0] || null;
  }

  async getAllUserRoles(userId: string): Promise<HealthStaffRecord[]> {
    const { data, error } = await supabase.rpc('health_get_all_user_roles', { p_user_id: userId });
    if (error) {
      console.error('RPC error:', error);
      return [];
    }
    return data || [];
  }

  async getStaffByFacility(facilityId: string, filters?: { role?: string; status?: string; search?: string }): Promise<HealthStaffRecord[]> {
    let query = supabase
      .from('health_staff')
      .select('*, health_facilities(name, type, county), user_profiles(email, full_name, phone, avatar_url)')
      .eq('facility_id', facilityId);

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) query = query.or(`user_profiles.full_name.ilike.%${filters.search}%,user_profiles.email.ilike.%${filters.search}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('getStaffByFacility error:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      facility_id: r.facility_id,
      role: r.role,
      department: r.department,
      status: r.status,
      onboarding_status: r.onboarding_status,
      is_on_duty: r.is_on_duty,
      specialization: r.specialization,
      years_of_experience: r.years_of_experience,
      consultation_fee: r.consultation_fee,
      license_number: r.license_number,
      license_body: r.license_body,
      facility_name: r.health_facilities?.name || null,
      facility_type: r.health_facilities?.type || null,
      county: r.health_facilities?.county || null,
      user_email: r.user_profiles?.email || null,
      user_full_name: r.user_profiles?.full_name || null,
      user_phone: r.user_profiles?.phone || null,
      user_avatar: r.user_profiles?.avatar_url || null,
    }));
  }

  async getAllStaffForSystemAdmin(): Promise<HealthStaffRecord[]> {
    const { data, error } = await supabase
      .from('health_staff')
      .select('*, health_facilities(name, type, county), user_profiles(email, full_name, phone, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAllStaffForSystemAdmin error:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      facility_id: r.facility_id,
      role: r.role,
      department: r.department,
      status: r.status,
      onboarding_status: r.onboarding_status,
      is_on_duty: r.is_on_duty,
      specialization: r.specialization,
      years_of_experience: r.years_of_experience,
      consultation_fee: r.consultation_fee,
      license_number: r.license_number,
      license_body: r.license_body,
      facility_name: r.health_facilities?.name || null,
      facility_type: r.health_facilities?.type || null,
      county: r.health_facilities?.county || null,
      user_email: r.user_profiles?.email || null,
      user_full_name: r.user_profiles?.full_name || null,
      user_phone: r.user_profiles?.phone || null,
      user_avatar: r.user_profiles?.avatar_url || null,
    }));
  }

  async getStaffStats(facilityId: string | null): Promise<StaffStats> {
    const { data, error } = await supabase.rpc('health_get_staff_stats', { p_facility_id: facilityId });
    if (error || !data) return { active: 0, pending: 0, total: 0 };
    return data;
  }

  async clockIn(staffId: string, facilityId: string | null): Promise<boolean> {
    const { error } = await supabase.rpc('health_staff_clock_in', {
      p_staff_id: staffId,
      p_facility_id: facilityId,
    });
    return !error;
  }

  async clockOut(staffId: string): Promise<boolean> {
    const { error } = await supabase.rpc('health_staff_clock_out', {
      p_staff_id: staffId,
    });
    return !error;
  }

  async clockInWithBiometric(staffId: string, facilityId: string | null): Promise<BiometricAuthResult> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return { success: false, method: 'unavailable', error: 'Biometric authentication not available. Please use PIN.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to Clock In',
      fallbackLabel: 'Use Device PIN',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { success: false, method: 'cancelled', error: result.error || 'Authentication cancelled' };
    }

    const { error } = await supabase.rpc('health_staff_clock_in', {
      p_staff_id: staffId,
      p_facility_id: facilityId,
      p_auth_method: 'biometric',
    });

    if (error) {
      return { success: false, method: 'biometric', error: error.message };
    }

    return { success: true, method: 'biometric' };
  }

  async clockOutWithBiometric(staffId: string): Promise<BiometricAuthResult> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return { success: false, method: 'unavailable', error: 'Biometric authentication not available. Please use PIN.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to Clock Out',
      fallbackLabel: 'Use Device PIN',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { success: false, method: 'cancelled', error: result.error || 'Authentication cancelled' };
    }

    const { error } = await supabase.rpc('health_staff_clock_out', {
      p_staff_id: staffId,
      p_auth_method: 'biometric',
    });

    if (error) {
      return { success: false, method: 'biometric', error: error.message };
    }

    return { success: true, method: 'biometric' };
  }
}

export const healthRoleService = new HealthRoleService();
