import { supabase } from '@/lib/supabase/client';

export type HealthRole =
  | 'system_admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab_technician'
  | 'radiologist'
  | 'hospital_admin'
  | 'cashier'
  | 'hr_manager'
  | 'accountant'
  | 'ambulance_driver'
  | 'receptionist';

export type StaffStatus = 'active' | 'pending' | 'suspended' | 'inactive';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface HealthStaffRecord {
  id: string;
  user_id: string;
  facility_id: string | null;
  role: HealthRole;
  department: string | null;
  specialization: string | null;
  status: StaffStatus;
  onboarding_status: OnboardingStatus;
  is_on_duty: boolean;
  years_of_experience: number | null;
  consultation_fee: number | null;
  license_number: string | null;
  license_body: string | null;
  created_at: string;
  updated_at: string;
  facility?: HealthFacility;
  // Fields from RPC joins
  user_email?: string;
  user_full_name?: string;
  facility_name?: string;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  level: number;
  county: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  bed_capacity: number;
  icu_beds: number;
  has_emergency: boolean;
  has_ambulance: boolean;
  created_at: string;
}

export interface StaffInvitation {
  email: string;
  role: HealthRole;
  department?: string;
  facilityId?: string;
}

export interface AttendanceRecord {
  staff_id: string;
  check_in: string;
  check_out?: string;
  notes?: string;
}

export interface PayrollRecord {
  staff_id: string;
  month: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'approved' | 'paid';
}

export const ROLE_PERMISSIONS: Record<HealthRole, string[]> = {
  system_admin: ['*'],
  doctor: ['view_patients', 'prescribe', 'view_records', 'telemedicine'],
  nurse: ['view_patients', 'vitals', 'medication', 'bed_management'],
  pharmacist: ['dispense', 'inventory', 'view_prescriptions'],
  lab_technician: ['lab_orders', 'results', 'inventory'],
  radiologist: ['imaging', 'reports', 'view_patients'],
  hospital_admin: ['manage_staff', 'manage_beds', 'view_reports', 'manage_facility'],
  cashier: ['process_payments', 'view_billing', 'refunds'],
  hr_manager: ['manage_staff', 'payroll', 'attendance', 'recruitment'],
  accountant: ['financial_reports', 'payroll', 'budgeting'],
  ambulance_driver: ['dispatch', 'patient_transport'],
  receptionist: ['register_patients', 'appointments', 'queue_management'],
};

export const ROLE_DISPLAY_NAMES: Record<HealthRole, string> = {
  system_admin: 'System Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  radiologist: 'Radiologist',
  hospital_admin: 'Hospital Admin',
  cashier: 'Cashier',
  hr_manager: 'HR Manager',
  accountant: 'Accountant',
  ambulance_driver: 'Ambulance Driver',
  receptionist: 'Receptionist',
};

export const ROLE_COLORS: Record<HealthRole, string> = {
  system_admin: '#dc2626',
  doctor: '#2563eb',
  nurse: '#059669',
  pharmacist: '#7c3aed',
  lab_technician: '#0891b2',
  radiologist: '#ea580c',
  hospital_admin: '#9333ea',
  cashier: '#ca8a04',
  hr_manager: '#db2777',
  accountant: '#4f46e5',
  ambulance_driver: '#dc2626',
  receptionist: '#6b7280',
};

function isTableMissingError(err: any): boolean {
  return err?.code === '42P01' || err?.message?.includes('relation') || err?.message?.includes('does not exist');
}

class HealthRoleService {
  /**
   * FIXED v3: Uses RPC to get primary staff record, then fetches facility
   * Returns the user's primary (most recent) active staff record WITH facility
   */
  async getCurrentUserRole(userId: string): Promise<HealthStaffRecord | null> {
    try {
      // Use the SECURITY DEFINER function to bypass RLS recursion
      const { data: staffData, error: staffError } = await supabase
        .rpc('health_get_primary_staff_record', { p_user_id: userId });

      if (staffError) {
        if (staffError.code === 'PGRST116') return null;
        console.error('[HealthRoleService] getCurrentUserRole RPC error:', staffError);
        throw staffError;
      }

      if (!staffData || staffData.length === 0) return null;

      const staff = staffData[0];

      // Fetch facility separately to avoid join RLS issues
      let facility: HealthFacility | undefined;
      if (staff.facility_id) {
        const { data: facData, error: facError } = await supabase
          .from('health_facilities')
          .select('*')
          .eq('id', staff.facility_id)
          .single();

        if (!facError && facData) {
          facility = facData as HealthFacility;
        } else if (facError) {
          console.warn('[HealthRoleService] Facility fetch error:', facError.message);
        }
      }

      return { ...staff, facility } as HealthStaffRecord;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        console.warn('[HealthRoleService] health_staff table missing');
        return null;
      }
      throw err;
    }
  }

  /**
   * Get staff by facility ID using RPC
   */
  async getStaffByFacility(
    facilityId: string,
    filters?: { status?: string; role?: string; search?: string }
  ): Promise<HealthStaffRecord[]> {
    const { data, error } = await supabase
      .rpc('health_get_staff_by_facility', {
        p_facility_id: facilityId,
        p_status_filter: filters?.status || 'All',
        p_role_filter: filters?.role || 'All Roles',
        p_search_query: filters?.search || '',
      });

    if (error) {
      console.error('[HealthRoleService] getStaffByFacility error:', error);
      throw error;
    }

    return (data || []) as HealthStaffRecord[];
  }

  /**
   * NEW: Get ALL staff for system admin using RPC
   */
  async getAllStaffForSystemAdmin(
    filters?: { status?: string; role?: string; search?: string }
  ): Promise<HealthStaffRecord[]> {
    const { data, error } = await supabase
      .rpc('health_get_all_staff_for_system_admin', {
        p_status_filter: filters?.status || 'All',
        p_role_filter: filters?.role || 'All Roles',
        p_search_query: filters?.search || '',
      });

    if (error) {
      console.error('[HealthRoleService] getAllStaffForSystemAdmin error:', error);
      throw error;
    }

    return (data || []) as HealthStaffRecord[];
  }

  /**
   * Invite staff member
   */
  async inviteStaff(invitation: StaffInvitation): Promise<void> {
    const { error } = await supabase
      .from('health_staff_invitations')
      .insert({
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        facility_id: invitation.facilityId,
        status: 'pending',
      });

    if (error) throw error;
  }

  /**
   * Approve staff member
   */
  async approveStaff(staffId: string): Promise<void> {
    const { error } = await supabase
      .from('health_staff')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', staffId);

    if (error) throw error;
  }

  /**
   * Suspend staff member
   */
  async suspendStaff(staffId: string): Promise<void> {
    const { error } = await supabase
      .from('health_staff')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', staffId);

    if (error) throw error;
  }

  /**
   * Get facilities
   */
  async getFacilities(): Promise<HealthFacility[]> {
    const { data, error } = await supabase
      .from('health_facilities')
      .select('*')
      .eq('status', 'verified');

    if (error) throw error;
    return (data || []) as HealthFacility[];
  }

  /**
   * Check if user has permission
   */
  hasPermission(role: HealthRole | null, permission: string): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes('*') || permissions.includes(permission);
  }
}

export const healthRoleService = new HealthRoleService();
