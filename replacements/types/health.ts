export type HealthRole = 'patient' | 'doctor' | 'nurse' | 'admin' | 'pharmacist' | 'lab_tech' | 'ambulance_driver';

export interface HealthStaffRecord {
  id: string;
  user_id: string;
  role: HealthRole;
  facility_id: string;
  department: string;
  license_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  is_active: boolean;
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  facility_id: string;
  email: string;
  role: HealthRole;
  status: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  facility_id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  status: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  staff_id: string;
  facility_id: string;
  period: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: string;
  created_at: string;
}

export interface OnboardingStatus {
  id: string;
  user_id: string;
  step: string;
  status: string;
  completed_at: string | null;
  created_at: string;
}
