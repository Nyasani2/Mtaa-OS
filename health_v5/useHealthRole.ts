import { useState, useEffect, useCallback, useRef } from 'react';
import { healthRoleService, type HealthRole, type HealthStaffRecord } from '@/lib/health/services';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface HealthRoleState {
  // Role selection
  allRoles: HealthStaffRecord[];
  selectedRole: HealthStaffRecord | null;
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
  // Actions
  selectRole: (record: HealthStaffRecord) => void;
  clearRoleSelection: () => void;
}

const TIMEOUT_MS = 8000;

export function useHealthRole(): HealthRoleState {
  const { user } = useAuthStore();
  const [allRoles, setAllRoles] = useState<HealthStaffRecord[]>([]);
  const [selectedRole, setSelectedRole] = useState<HealthStaffRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      if (mountedRef.current) { setIsLoading(false); setError(null); setAllRoles([]); }
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) { setIsLoading(false); setError('Role detection timed out. Please check your connection.'); }
    }, TIMEOUT_MS);

    try {
      if (mountedRef.current) { setIsLoading(true); setError(null); }

      // Get ALL roles for this user
      const roles = await healthRoleService.getAllUserRoles(user.id);

      if (mountedRef.current) {
        setAllRoles(roles);
        // If only one role, auto-select it
        if (roles.length === 1 && !selectedRole) {
          setSelectedRole(roles[0]);
        }
        // If no roles, try the primary record (backward compat)
        if (roles.length === 0) {
          const primary = await healthRoleService.getCurrentUserRole(user.id);
          if (primary) {
            setAllRoles([primary]);
            setSelectedRole(primary);
          }
        }
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setAllRoles([]);
        if (err.code === 'PGRST116' || err.message?.includes('no rows')) setError(null);
        else setError(err.message || 'Failed to load role information');
      }
    } finally {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      if (mountedRef.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRoles();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchRoles]);

  const selectRole = useCallback((record: HealthStaffRecord) => {
    setSelectedRole(record);
  }, []);

  const clearRoleSelection = useCallback(() => {
    setSelectedRole(null);
  }, []);

  const role = selectedRole?.role || null;
  const staffRecord = selectedRole;
  const facilityId = selectedRole?.facility_id || null;
  const isSystemAdmin = role === 'system_admin';
  const hasAnyRole = allRoles.length > 0;

  return {
    allRoles,
    selectedRole,
    role,
    staffRecord,
    facilityId,
    isLoading,
    isSystemAdmin,
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
    isPatient: !hasAnyRole,
    canManageStaff: isSystemAdmin || role === 'hospital_admin' || role === 'hr_manager',
    canManageFacilities: isSystemAdmin,
    canPrescribe: role === 'doctor',
    canViewRecords: !!role && role !== 'receptionist',
    canManageInventory: role === 'pharmacist' || role === 'lab_technician' || role === 'hospital_admin',
    canProcessPayments: role === 'cashier' || role === 'hospital_admin',
    error,
    selectRole,
    clearRoleSelection,
  };
}
