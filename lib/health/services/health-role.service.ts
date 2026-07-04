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

export type StaffStatus = 'active' | 'suspended' | 'on_leave';
export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

export interface HealthStaffRecord {
  id: string;
  user_id: string;
  facility_id: string;
  role: HealthRole;
  department: string | null;
  specialization: string | null;
  license_number: string | null;
  years_of_experience: number;
  consultation_fee: number;
  languages: string[];
  shift_preference: string | null;
  onboarding_status: OnboardingStatus;
  status: StaffStatus;
  is_on_duty: boolean;
  clock_in_time: string | null;
  clock_out_time: string | null;
  created_at: string;
  updated_at: string;
  facility?: HealthFacility;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  license_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  verification_status: string;
  is_active: boolean;
  admin_user_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  facility_id: string;
  email: string;
  role: HealthRole;
  department: string | null;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export interface PayrollRecord {
  id: string;
  staff_id: string;
  month: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: string;
}

export const ROLE_DISPLAY_NAMES: Record<HealthRole, string> = {
  system_admin: 'System Administrator',
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
  system_admin: '#1e3a5f',
  doctor: '#0066cc',
  nurse: '#00a86b',
  pharmacist: '#9333ea',
  lab_technician: '#0891b2',
  radiologist: '#dc2626',
  hospital_admin: '#ea580c',
  cashier: '#ca8a04',
  hr_manager: '#db2777',
  accountant: '#7c3aed',
  ambulance_driver: '#dc2626',
  receptionist: '#059669',
};

export const ROLE_PERMISSIONS: Record<HealthRole, string[]> = {
  system_admin: ['all'],
  doctor: ['prescribe', 'view_records', 'lab_orders', 'telemedicine'],
  nurse: ['vitals', 'medication_admin', 'bed_management', 'view_records'],
  pharmacist: ['dispense', 'inventory', 'drug_interactions'],
  lab_technician: ['lab_tests', 'results_entry', 'equipment'],
  radiologist: ['imaging', 'reports'],
  hospital_admin: ['staff_management', 'bed_occupancy', 'revenue', 'settings'],
  cashier: ['payments', 'insurance_verify', 'invoices'],
  hr_manager: ['payroll', 'attendance', 'shifts', 'leave', 'onboarding'],
  accountant: ['revenue', 'budget', 'procurement', 'tax'],
  ambulance_driver: ['dispatches', 'location', 'transport'],
  receptionist: ['register_patient', 'book_appointment', 'check_in', 'queue'],
};

class HealthRoleService {
  // ===== ROLE DETECTION =====
  async getCurrentUserRole(userId: string): Promise<HealthStaffRecord | null> {
    const { data, error } = await supabase
      .from('health_staff')
      .select(`
        *,
        facility:health_facilities(id, name, type, license_number, address, city, country, phone, email, verification_status, is_active, admin_user_id, latitude, longitude, created_at)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows
      console.error('getCurrentUserRole error:', error);
      throw error;
    }
    return data as HealthStaffRecord;
  }

  // ===== STAFF MANAGEMENT =====
  async getStaffByFacility(facilityId: string, filters?: { role?: HealthRole; status?: StaffStatus }) {
    let query = supabase
      .from('health_staff')
      .select(`
        *,
        facility:health_facilities(id, name, type),
        profile:user_profiles(id, full_name, email, phone, avatar_url)
      `)
      .eq('facility_id', facilityId);

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async inviteStaff(invitation: Omit<StaffInvitation, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('health_staff_invitations')
      .insert({
        ...invitation,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async approveStaff(staffId: string) {
    const { data, error } = await supabase
      .from('health_staff')
      .update({ onboarding_status: 'approved', status: 'active' })
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async suspendStaff(staffId: string) {
    const { data, error } = await supabase
      .from('health_staff')
      .update({ status: 'suspended' })
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ===== CLOCK IN/OUT =====
  async clockIn(staffId: string, notes?: string) {
    const { data, error } = await supabase
      .from('health_staff')
      .update({
        is_on_duty: true,
        clock_in_time: new Date().toISOString(),
        clock_out_time: null,
      })
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;

    // Also create attendance record
    await supabase.from('health_attendance').insert({
      staff_id: staffId,
      clock_in: new Date().toISOString(),
      notes: notes || null,
    });

    return data;
  }

  async clockOut(staffId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('health_staff')
      .update({
        is_on_duty: false,
        clock_out_time: now,
      })
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;

    // Update latest attendance record
    const { data: latest } = await supabase
      .from('health_attendance')
      .select('id, clock_in')
      .eq('staff_id', staffId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      const clockIn = new Date(latest.clock_in);
      const clockOut = new Date(now);
      const duration = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);
      await supabase
        .from('health_attendance')
        .update({ clock_out: now, duration_minutes: duration })
        .eq('id', latest.id);
    }

    return data;
  }

  // ===== FACILITIES =====
  async getFacilities(filters?: { type?: string; verified?: boolean; city?: string }) {
    let query = supabase
      .from('health_facilities')
      .select('*');

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.verified !== undefined) query = query.eq('verification_status', filters.verified ? 'verified' : 'pending');
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as HealthFacility[];
  }

  async getFacilityById(id: string) {
    const { data, error } = await supabase
      .from('health_facilities')
      .select(`
        *,
        departments:health_departments(*),
        staff:health_staff(*, profile:user_profiles(id, full_name, email, avatar_url))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async registerFacility(facility: Partial<HealthFacility>) {
    const { data, error } = await supabase
      .from('health_facilities')
      .insert(facility)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ===== DEPARTMENTS =====
  async getDepartments(facilityId: string) {
    const { data, error } = await supabase
      .from('health_departments')
      .select('*')
      .eq('facility_id', facilityId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // ===== PAYROLL =====
  async getPayroll(staffId: string, month?: string) {
    let query = supabase.from('health_payroll').select('*').eq('staff_id', staffId);
    if (month) query = query.eq('month', month);
    const { data, error } = await query.order('month', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ===== ATTENDANCE =====
  async getAttendance(staffId: string, startDate?: string, endDate?: string) {
    let query = supabase.from('health_attendance').select('*').eq('staff_id', staffId);
    if (startDate) query = query.gte('clock_in', startDate);
    if (endDate) query = query.lte('clock_in', endDate);
    const { data, error } = await query.order('clock_in', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ===== SHIFT MANAGEMENT =====
  async getShifts(facilityId: string, date?: string) {
    let query = supabase.from('health_shifts').select('*').eq('facility_id', facilityId);
    if (date) query = query.eq('date', date);
    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // ===== ANALYTICS =====
  async getFacilityAnalytics(facilityId: string) {
    const { data: staffCount } = await supabase
      .from('health_staff')
      .select('id', { count: 'exact' })
      .eq('facility_id', facilityId)
      .eq('status', 'active');

    const { data: onDuty } = await supabase
      .from('health_staff')
      .select('id', { count: 'exact' })
      .eq('facility_id', facilityId)
      .eq('is_on_duty', true);

    const { data: pending } = await supabase
      .from('health_staff')
      .select('id', { count: 'exact' })
      .eq('facility_id', facilityId)
      .eq('onboarding_status', 'pending');

    return {
      totalStaff: staffCount?.length || 0,
      onDuty: onDuty?.length || 0,
      pendingApprovals: pending?.length || 0,
    };
  }
}

export const healthRoleService = new HealthRoleService();
