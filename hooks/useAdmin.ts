// ============================================================================
// hooks/useAdmin.ts — Admin Status Hook
// ============================================================================
// Reads admin privileges from profiles table:
//   - is_admin (boolean) → super admin flag
//   - role (user_role enum) → role string
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "./useAuthStore";
import { supabase } from "@/lib/supabase/client";

export type AdminLevel = "none" | "admin" | "super_admin";

export interface AdminStatus {
  isAdmin: boolean;        // true if is_admin = true OR role = 'admin'
  isSuperAdmin: boolean;   // true if is_admin = true
  level: AdminLevel;
  role: string | null;     // raw role from profiles.role
  loading: boolean;
  error: string | null;
}

const DEFAULT: AdminStatus = {
  isAdmin: false,
  isSuperAdmin: false,
  level: "none",
  role: null,
  loading: true,
  error: null,
};

export function useAdmin(): AdminStatus {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<AdminStatus>(DEFAULT);

  const fetchAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setStatus({ ...DEFAULT, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const isSuperAdmin = !!data?.is_admin;
      const isAdmin = isSuperAdmin || data?.role === "admin";
      const level: AdminLevel = isSuperAdmin ? "super_admin" : isAdmin ? "admin" : "none";

      setStatus({
        isAdmin,
        isSuperAdmin,
        level,
        role: data?.role || null,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setStatus({
        ...DEFAULT,
        loading: false,
        error: err?.message || "Failed to load admin status",
      });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);

  return status;
}
