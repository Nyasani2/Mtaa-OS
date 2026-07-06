import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { healthRoleService } from "@/lib/health/services/health-role.service";
import { HealthRole, StaffRecord } from "@/lib/health/types";

export interface UseHealthRoleReturn {
  role: HealthRole | null;
  displayName: string;
  isPatient: boolean;
  isAdmin: boolean;
  isClinical: boolean;
  isOperational: boolean;
  staffRecord: StaffRecord | null;
  allRoles: { id: string; facility_id: string | null; role: HealthRole; department: string | null; facility_name: string | null; verified: boolean }[];
  loading: boolean;
  error: string | null;
  selectedRole: HealthRole | null;
  selectedFacilityId: string | null;
  refresh: () => Promise<void>;
  selectRole: (role: HealthRole, facilityId: string) => void;
  clearRoleSelection: () => void;
  clockIn: (method?: string) => Promise<{ success: boolean; error?: string }>;
  clockOut: (method?: string) => Promise<{ success: boolean; error?: string }>;
}

export function useHealthRole(): UseHealthRoleReturn {
  const user = useAuthStore((s) => s.user);
  const [role, setRole] = useState<HealthRole | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffRecord | null>(null);
  const [allRoles, setAllRoles] = useState<UseHealthRoleReturn["allRoles"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<HealthRole | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  // ============================================================
  // FIX: Use refs for selection state to break the re-render loop
  // ============================================================
  const selectedRoleRef = useRef(selectedRole);
  const selectedFacilityIdRef = useRef(selectedFacilityId);

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    selectedFacilityIdRef.current = selectedFacilityId;
  }, [selectedFacilityId]);

  // ============================================================
  // FIX: fetchRole NO LONGER depends on selectedRole/selectedFacilityId
  // It reads from refs instead, preventing the infinite loop
  // ============================================================
  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setRole(null);
      setStaffRecord(null);
      setAllRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const primary = await healthRoleService.getPrimaryStaffRecord(user.id);
      const all = await healthRoleService.getAllUserRoles(user.id);

      setStaffRecord(primary);
      setAllRoles(all);

      if (primary) {
        // Read selection from refs, NOT from state (breaks the loop)
        const currentSelectedRole = selectedRoleRef.current;
        const currentSelectedFacilityId = selectedFacilityIdRef.current;

        if (currentSelectedRole && all.some((r) => r.role === currentSelectedRole && r.facility_id === currentSelectedFacilityId)) {
          setRole(currentSelectedRole);
        } else {
          setRole(primary.role);
          setSelectedRole(primary.role);
          setSelectedFacilityId(primary.facilityId || null);
        }
      } else {
        setRole("patient");
        setSelectedRole(null);
        setSelectedFacilityId(null);
      }
    } catch (err: any) {
      console.error("[useHealthRole] fetch error:", err);
      setError(err.message || "Failed to load role");
      setRole("patient");
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // ← ONLY depends on user.id, NOT selectedRole/selectedFacilityId

  // ============================================================
  // FIX: Only run fetchRole when user.id changes, not on every render
  // ============================================================
  useEffect(() => {
    fetchRole();
  }, [user?.id]); // ← Direct dependency on user.id, NOT fetchRole reference

  const selectRole = useCallback((newRole: HealthRole, facilityId: string) => {
    setSelectedRole(newRole);
    setSelectedFacilityId(facilityId);
    setRole(newRole);
  }, []);

  const clearRoleSelection = useCallback(() => {
    setSelectedRole(null);
    setSelectedFacilityId(null);
    if (staffRecord) {
      setRole(staffRecord.role);
    } else {
      setRole("patient");
    }
  }, [staffRecord]);

  const clockIn = useCallback(
    async (method: string = "manual") => {
      if (!user?.id || !selectedFacilityId) {
        return { success: false, error: "No facility selected" };
      }
      const result = await healthRoleService.clockIn(user.id, selectedFacilityId, method);
      if (result.success) {
        await fetchRole();
      }
      return result;
    },
    [user?.id, selectedFacilityId, fetchRole]
  );

  const clockOut = useCallback(
    async (method: string = "manual") => {
      if (!user?.id || !selectedFacilityId) {
        return { success: false, error: "No facility selected" };
      }
      const result = await healthRoleService.clockOut(user.id, selectedFacilityId, method);
      if (result.success) {
        await fetchRole();
      }
      return result;
    },
    [user?.id, selectedFacilityId, fetchRole]
  );

  const displayName = healthRoleService.getDisplayName(role || "patient");
  const isPatient = role === "patient" || role === null;
  const isAdmin = healthRoleService.isAdmin(role || "patient");
  const isClinical = healthRoleService.isClinical(role || "patient");
  const isOperational = healthRoleService.isOperational(role || "patient");

  return {
    role,
    displayName,
    isPatient,
    isAdmin,
    isClinical,
    isOperational,
    staffRecord,
    allRoles,
    loading,
    error,
    selectedRole,
    selectedFacilityId,
    refresh: fetchRole,
    selectRole,
    clearRoleSelection,
    clockIn,
    clockOut,
  };
}
