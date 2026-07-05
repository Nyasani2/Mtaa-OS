import { supabase } from '@/lib/supabase/client';

export type HealthRole =
  | 'system_admin' | 'doctor' | 'nurse' | 'pharmacist' | 'lab_technician'
  | 'radiologist' | 'hospital_admin' | 'cashier' | 'hr_manager'
  | 'accountant' | 'ambulance_driver' | 'receptionist';

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
  user_email?: string;
  user_full_name?: string;
  facility_name?: string;
}

export interface HealthFacility {
  id: string; name: string; type: string; level: number;
  county: string | null; phone: string | null; email: string | null;
  status: string; bed_capacity: number; icu_beds: number;
  has_emergency: boolean; has_ambulance: boolean; created_at: string;
}

export interface StaffInvitation {
  email: string; role: HealthRole; department?: string; facilityId?: string;
}

export interface AttendanceRecord {
  staff_id: string; check_in: string; check_out?: string; notes?: string;
}

export interface PayrollRecord {
  staff_id: string; month: string; base_salary: number;
  allowances: number; deductions: number; net_pay: number;
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
  system_admin: 'System Admin', doctor: 'Doctor', nurse: 'Nurse',
  pharmacist: 'Pharmacist', lab_technician: 'Lab Technician',
  radiologist: 'Radiologist', hospital_admin: 'Hospital Admin',
  cashier: 'Cashier', hr_manager: 'HR Manager', accountant: 'Accountant',
  ambulance_driver: 'Ambulance Driver', receptionist: 'Receptionist',
};

export const ROLE_COLORS: Record<HealthRole, string> = {
  system_admin: '#dc2626', doctor: '#2563eb', nurse: '#16a34a',
  pharmacist: '#9333ea', lab_technician: '#0891b2', radiologist: '#ea580c',
  hospital_admin: '#ca8a04', cashier: '#db2777', hr_manager: '#4f46e5',
  accountant: '#059669', ambulance_driver: '#b91c1c', receptionist: '#6b7280',
};

function isTableMissingError(err: any): boolean {
  const msg = err?.message || err?.error_description || '';
  return (msg.includes('relation') && msg.includes('does not exist')) || msg.includes('42P01');
}

class HealthRoleService {
  async getCurrentUserRole(userId: string): Promise<HealthStaffRecord | null> {
    try {
      const { data: staffData, error: staffError } = await supabase
        .rpc('health_get_primary_staff_record', { p_user_id: userId });
      if (staffError) {
        if (staffError.code === 'PGRST116') return null;
        console.error('[HealthRoleService] getCurrentUserRole RPC error:', staffError);
        throw staffError;
      }
      if (!staffData || staffData.length === 0) return null;
      const staff = staffData[0];
      let facility: HealthFacility | undefined;
      if (staff.facility_id) {
        const { data: facData, error: facError } = await supabase
          .from('health_facilities').select('*').eq('id', staff.facility_id).single();
        if (!facError && facData) facility = facData as HealthFacility;
        else if (facError) console.warn('[HealthRoleService] Facility fetch error:', facError.message);
      }
      return { ...staff, facility } as HealthStaffRecord;
    } catch (err: any) {
      if (isTableMissingError(err)) { console.warn('[HealthRoleService] health_staff table missing'); return null; }
      throw err;
    }
  }

  async getStaffStats(facilityId?: string | null): Promise<{ active: number; pending: number; total: number }> {
    try {
      const { data, error } = await supabase.rpc('health_get_staff_stats', { p_facility_id: facilityId || null });
      if (error) { console.error('[HealthRoleService] getStaffStats error:', error); return { active: 0, pending: 0, total: 0 }; }
      if (!data || data.length === 0) return { active: 0, pending: 0, total: 0 };
      return { active: Number(data[0].active_count) || 0, pending: Number(data[0].pending_count) || 0, total: Number(data[0].total_count) || 0 };
    } catch (err: any) { console.error('[HealthRoleService] getStaffStats exception:', err); return { active: 0, pending: 0, total: 0 }; }
  }

  async getAllStaffForSystemAdmin(filters?: { status?: string; role?: string; search?: string }): Promise<HealthStaffRecord[]> {
    try {
      const { data, error } = await supabase.rpc('health_get_all_staff_for_admin', {
        p_status_filter: filters?.status || null, p_role_filter: filters?.role || null, p_search_query: filters?.search || null,
      });
      if (error) { console.error('[HealthRoleService] getAllStaffForSystemAdmin error:', error); throw error; }
      return (data || []) as HealthStaffRecord[];
    } catch (err: any) { if (isTableMissingError(err)) return []; throw err; }
  }

  async getStaffByFacility(facilityId: string, filters?: { status?: string; role?: string; search?: string }): Promise<HealthStaffRecord[]> {
    try {
      const { data, error } = await supabase.rpc('health_get_staff_by_facility', {
        p_facility_id: facilityId, p_status_filter: filters?.status || null,
        p_role_filter: filters?.role || null, p_search_query: filters?.search || null,
      });
      if (error) { console.error('[HealthRoleService] getStaffByFacility error:', error); throw error; }
      return (data || []) as HealthStaffRecord[];
    } catch (err: any) { if (isTableMissingError(err)) return []; throw err; }
  }

  async inviteStaff(invitation: StaffInvitation): Promise<void> {
    const { error } = await supabase.from('health_staff_invitations').insert({
      email: invitation.email, role: invitation.role, department: invitation.department,
      facility_id: invitation.facilityId, status: 'pending',
    });
    if (error) throw error;
  }

  async approveStaff(staffId: string): Promise<void> {
    const { error } = await supabase.from('health_staff').update({ status: 'active', onboarding_status: 'in_progress' }).eq('id', staffId);
    if (error) throw error;
  }

  async suspendStaff(staffId: string): Promise<void> {
    const { error } = await supabase.from('health_staff').update({ status: 'suspended' }).eq('id', staffId);
    if (error) throw error;
  }

  /** Clock in a staff member */
  async clockIn(staffId: string): Promise<void> {
    const { error } = await supabase.from('health_staff').update({ is_on_duty: true }).eq('id', staffId);
    if (error) throw error;
  }

  /** Clock out a staff member */
  async clockOut(staffId: string): Promise<void> {
    const { error } = await supabase.from('health_staff').update({ is_on_duty: false }).eq('id', staffId);
    if (error) throw error;
  }
}

export const healthRoleService = new HealthRoleService();
