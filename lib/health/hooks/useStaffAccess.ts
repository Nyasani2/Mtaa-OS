import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface StaffAccess {
  isStaff: boolean;
  isLoading: boolean;
  staffRecord: any | null;
  facility: any | null;
  role: string | null;
  permissions: string[];
  error: string | null;
}

const STAFF_ROLES = [
  'doctor', 'nurse', 'lab_technician', 'pharmacist', 'radiologist',
  'receptionist', 'accountant', 'admin', 'hospital_admin',
  'ambulance_driver', 'housekeeping', 'cashier'
];

export function useStaffAccess(facilityId?: string): StaffAccess {
  const { user } = useAuthStore();
  const [state, setState] = useState<StaffAccess>({
    isStaff: false, isLoading: true, staffRecord: null, facility: null,
    role: null, permissions: [], error: null,
  });

  useEffect(() => {
    if (!user?.id) {
      setState(s => ({ ...s, isLoading: false, error: 'Not authenticated' }));
      return;
    }
    checkStaffAccess();
  }, [user?.id, facilityId]);

  const checkStaffAccess = async () => {
    try {
      let query = supabase
        .from('health_staff')
        .select(`
          id, user_id, facility_id, role, status, full_name,
          health_facilities!inner(id, name, type, status)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');
      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }
      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        setState({
          isStaff: false, isLoading: false, staffRecord: null, facility: null,
          role: null, permissions: [], error: 'Access denied. Staff account required.',
        });
        return;
      }
      if (!STAFF_ROLES.includes(data.role)) {
        setState({
          isStaff: false, isLoading: false, staffRecord: data, facility: data.health_facilities,
          role: data.role, permissions: [], error: `Role "${data.role}" does not have staff access.`,
        });
        return;
      }
      const permissions = getPermissionsForRole(data.role);
      setState({
        isStaff: true, isLoading: false, staffRecord: data, facility: data.health_facilities,
        role: data.role, permissions, error: null,
      });
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err.message }));
    }
  };

  return state;
}

function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    doctor: ['consult', 'prescribe', 'order_lab', 'admit', 'discharge', 'view_records'],
    nurse: ['record_vitals', 'administer_meds', 'triage', 'view_records'],
    lab_technician: ['process_lab', 'upload_results', 'view_lab_orders'],
    pharmacist: ['dispense', 'manage_inventory', 'view_prescriptions'],
    receptionist: ['check_in', 'schedule', 'view_appointments'],
    accountant: ['manage_prices', 'view_billing', 'process_payments', 'view_reports'],
    admin: ['manage_staff', 'manage_prices', 'view_all', 'manage_facility'],
    hospital_admin: ['manage_staff', 'manage_prices', 'view_all', 'manage_facility'],
    cashier: ['process_payments', 'view_billing'],
    ambulance_driver: ['dispatch', 'handover'],
    housekeeping: ['manage_beds', 'cleaning'],
    radiologist: ['upload_imaging', 'view_radiology_orders'],
  };
  return rolePermissions[role] || [];
}
