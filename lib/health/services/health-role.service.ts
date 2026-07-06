import { supabase } from "@/lib/supabase";
import { HealthRole, StaffRecord } from "@/lib/health/types";

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  system_admin: "System Admin",
  facility_admin: "Facility Admin",
  hospital_admin: "Hospital Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  lab_technician: "Lab Technician",
  radiologist: "Radiologist",
  receptionist: "Receptionist",
  cashier: "Cashier",
  accountant: "Accountant",
  hr_manager: "HR Manager",
  ambulance_dispatcher: "Ambulance Dispatcher",
  emergency_responder: "Emergency Responder",
  insurance_officer: "Insurance Officer",
  pharmacy_manager: "Pharmacy Manager",
  data_analyst: "Data Analyst",
  government_admin: "Government Admin",
  patient: "Patient",
};

export const ROLE_ICONS: Record<string, string> = {
  system_admin: "shield-checkmark",
  facility_admin: "business",
  hospital_admin: "medical",
  doctor: "stethoscope",
  nurse: "heart",
  pharmacist: "medkit",
  lab_technician: "flask",
  radiologist: "scan",
  receptionist: "people",
  cashier: "cash",
  accountant: "calculator",
  hr_manager: "person",
  ambulance_dispatcher: "car",
  emergency_responder: "alert",
  insurance_officer: "document-text",
  pharmacy_manager: "medical",
  data_analyst: "bar-chart",
  government_admin: "globe",
  patient: "person",
};

export const ROLE_COLORS: Record<string, string> = {
  system_admin: "#dc2626",
  facility_admin: "#ea580c",
  hospital_admin: "#2563eb",
  doctor: "#059669",
  nurse: "#0891b2",
  pharmacist: "#7c3aed",
  lab_technician: "#db2777",
  radiologist: "#9333ea",
  receptionist: "#ca8a04",
  cashier: "#16a34a",
  accountant: "#2563eb",
  hr_manager: "#4f46e5",
  ambulance_dispatcher: "#dc2626",
  emergency_responder: "#ea580c",
  insurance_officer: "#0891b2",
  pharmacy_manager: "#7c3aed",
  data_analyst: "#059669",
  government_admin: "#1f2937",
  patient: "#6b7280",
};

export const ROLE_DASHBOARD_ROUTES: Record<string, string[]> = {
  system_admin: ["/(os)/health/system/analytics", "/(os)/health/system/roles", "/(os)/health/system/integrations", "/(os)/health/government/verify-facilities"],
  facility_admin: ["/(os)/health/hospital-admin/revenue", "/(os)/health/hr/payroll", "/(os)/health/hr/attendance", "/(os)/health/hr/shifts", "/(os)/health/hr/leave"],
  hospital_admin: ["/(os)/health/hospital-admin/revenue", "/(os)/health/system/analytics", "/(os)/health/hr/payroll"],
  doctor: ["/(os)/health/doctor/queue", "/(os)/health/doctor/schedule", "/(os)/health/doctor/prescribe", "/(os)/health/doctor/lab-orders", "/(os)/health/doctor/earnings"],
  nurse: ["/(os)/health/nurse/beds", "/(os)/health/nurse/medication", "/(os)/health/nurse/handover"],
  pharmacist: ["/(os)/health/pharmacy/pos", "/(os)/health/pharmacy/inventory", "/(os)/health/pharmacy/dispense", "/(os)/health/pharmacy/interactions", "/(os)/health/pharmacy/suppliers"],
  lab_technician: ["/(os)/health/lab/queue", "/(os)/health/lab/critical", "/(os)/health/lab/equipment"],
  radiologist: ["/(os)/health/lab/queue", "/(os)/health/lab/equipment"],
  receptionist: ["/(os)/health/receptionist/register", "/(os)/health/receptionist/checkin", "/(os)/health/receptionist/queue"],
  cashier: ["/(os)/health/cashier/payments", "/(os)/health/cashier/insurance", "/(os)/health/cashier/invoices", "/(os)/health/cashier/revenue"],
  accountant: ["/(os)/health/accountant/revenue", "/(os)/health/accountant/budget", "/(os)/health/accountant/procurement", "/(os)/health/accountant/tax", "/(os)/health/accountant/compliance"],
  hr_manager: ["/(os)/health/hr/payroll", "/(os)/health/hr/attendance", "/(os)/health/hr/shifts", "/(os)/health/hr/leave"],
  ambulance_dispatcher: ["/(os)/health/ambulance/dispatches", "/(os)/health/ambulance/location", "/(os)/health/ambulance/log"],
  emergency_responder: ["/(os)/health/ambulance/dispatches", "/(os)/health/emergency"],
  insurance_officer: ["/(os)/health/cashier/insurance"],
  pharmacy_manager: ["/(os)/health/pharmacy/pos", "/(os)/health/pharmacy/inventory", "/(os)/health/pharmacy/suppliers"],
  data_analyst: ["/(os)/health/system/analytics"],
  government_admin: ["/(os)/health/government/verify-facilities"],
  patient: ["/(os)/health/appointments", "/(os)/health/find-care", "/(os)/health/records"],
};

export interface AllRoleRecord {
  id: string;
  facility_id: string | null;
  role: HealthRole;
  department: string | null;
  facility_name: string | null;
  verified: boolean;
}

export interface ClockInResult {
  success: boolean;
  record_id?: string;
  clock_in?: string;
  staff_id?: string;
  error?: string;
}

export interface ClockOutResult {
  success: boolean;
  record_id?: string;
  clock_out?: string;
  hours_worked?: number;
  staff_id?: string;
  error?: string;
}

class HealthRoleService {
  async getPrimaryStaffRecord(userId: string): Promise<StaffRecord | null> {
    try {
      const { data, error } = await supabase.rpc("health_get_primary_staff_record", {
        p_user_id: userId,
      });

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("[HealthRoleService] RPC error:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        id: row.id,
        userId: row.user_id,
        facilityId: row.facility_id,
        role: row.role as HealthRole,
        department: row.department,
        licenseNumber: row.license_number,
        verified: row.verified,
        specialization: row.specialization,
        shiftPattern: row.shift_pattern,
        biometricEnrolled: row.biometric_enrolled,
        lastClockIn: row.last_clock_in,
        lastClockOut: row.last_clock_out,
        isOnDuty: row.is_on_duty,
        status: row.status,
        onboardingStatus: row.onboarding_status,
      };
    } catch (err) {
      console.error("[HealthRoleService] getPrimaryStaffRecord error:", err);
      return null;
    }
  }

  async getAllUserRoles(userId: string): Promise<AllRoleRecord[]> {
    try {
      const { data, error } = await supabase.rpc("health_get_all_user_roles", {
        p_user_id: userId,
      });

      if (error) {
        console.error("[HealthRoleService] getAllUserRoles RPC error:", error);
        return [];
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        facility_id: row.facility_id,
        role: row.role as HealthRole,
        department: row.department,
        facility_name: row.facility_name,
        verified: row.verified,
      }));
    } catch (err) {
      console.error("[HealthRoleService] getAllUserRoles error:", err);
      return [];
    }
  }

  async clockIn(userId: string, facilityId: string, method: string = "manual"): Promise<ClockInResult> {
    try {
      const { data, error } = await supabase.rpc("health_clock_in", {
        p_user_id: userId,
        p_facility_id: facilityId,
        p_method: method,
      });

      if (error) {
        console.error("[HealthRoleService] clockIn RPC error:", error);
        return { success: false, error: error.message };
      }

      return data as ClockInResult;
    } catch (err: any) {
      console.error("[HealthRoleService] clockIn error:", err);
      return { success: false, error: err.message || "Clock-in failed" };
    }
  }

  async clockOut(userId: string, facilityId: string, method: string = "manual"): Promise<ClockOutResult> {
    try {
      const { data, error } = await supabase.rpc("health_clock_out", {
        p_user_id: userId,
        p_facility_id: facilityId,
        p_method: method,
      });

      if (error) {
        console.error("[HealthRoleService] clockOut RPC error:", error);
        return { success: false, error: error.message };
      }

      return data as ClockOutResult;
    } catch (err: any) {
      console.error("[HealthRoleService] clockOut error:", err);
      return { success: false, error: err.message || "Clock-out failed" };
    }
  }

  getDisplayName(role: HealthRole | string): string {
    return ROLE_DISPLAY_NAMES[role] || "Unknown";
  }

  getIcon(role: HealthRole | string): string {
    return ROLE_ICONS[role] || "person";
  }

  getColor(role: HealthRole | string): string {
    return ROLE_COLORS[role] || "#6b7280";
  }

  getDashboardRoutes(role: HealthRole | string): string[] {
    return ROLE_DASHBOARD_ROUTES[role] || ROLE_DASHBOARD_ROUTES["patient"];
  }

  isAdmin(role: HealthRole | string): boolean {
    return ["system_admin", "facility_admin", "hospital_admin", "government_admin"].includes(role as string);
  }

  isClinical(role: HealthRole | string): boolean {
    return ["doctor", "nurse", "pharmacist", "lab_technician", "radiologist"].includes(role as string);
  }

  isOperational(role: HealthRole | string): boolean {
    return ["receptionist", "cashier", "accountant", "hr_manager", "ambulance_dispatcher", "emergency_responder", "insurance_officer", "pharmacy_manager", "data_analyst"].includes(role as string);
  }
}

export const healthRoleService = new HealthRoleService();
