import { useState, useEffect, useCallback } from 'react';
import { healthRoleService, type HealthRole, type HealthStaffRecord } from '@/lib/health/services';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface HealthRoleState {
  role: HealthRole | null;
  staffRecord: HealthStaffRecord | null;
  facilityId: string | null;
  isLoading: boolean;
  isSystemAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isPharmacist: boolean;
  isLabTech: boolean;
  isHospitalAdmin: boolean;
  isCashier: boolean;
  isHRManager: boolean;
  isAccountant: boolean;
  isAmbulanceDriver: boolean;
  isReceptionist: boolean;
  isPatient: boolean;
  canManageStaff: boolean;
  canManageFacilities: boolean;
  canPrescribe: boolean;
  canViewRecords: boolean;
  canManageInventory: boolean;
  canProcessPayments: boolean;
  error: string | null;
}

export function useHealthRole(): HealthRoleState {
  const { user } = useAuthStore();
  const [staffRecord, setStaffRecord] = useState<HealthStaffRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const record = await healthRoleService.getCurrentUserRole(user.id);
      setStaffRecord(record);
    } catch (err: any) {
      console.error('useHealthRole error:', err);
      setError(err.message || 'Failed to load role');
      setStaffRecord(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const role = staffRecord?.role || null;
  const facilityId = staffRecord?.facility_id || null;

  return {
    role,
    staffRecord,
    facilityId,
    isLoading,
    isSystemAdmin: role === 'system_admin',
    isDoctor: role === 'doctor',
    isNurse: role === 'nurse',
    isPharmacist: role === 'pharmacist',
    isLabTech: role === 'lab_technician',
    isHospitalAdmin: role === 'hospital_admin',
    isCashier: role === 'cashier',
    isHRManager: role === 'hr_manager',
    isAccountant: role === 'accountant',
    isAmbulanceDriver: role === 'ambulance_driver',
    isReceptionist: role === 'receptionist',
    isPatient: !role,
    canManageStaff: role === 'system_admin' || role === 'hospital_admin' || role === 'hr_manager',
    canManageFacilities: role === 'system_admin',
    canPrescribe: role === 'doctor',
    canViewRecords: !!role && role !== 'receptionist',
    canManageInventory: role === 'pharmacist' || role === 'lab_technician' || role === 'hospital_admin',
    canProcessPayments: role === 'cashier' || role === 'hospital_admin',
    error,
  };
}
