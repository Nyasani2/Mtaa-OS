import type { HealthRole as HealthRoleType } from "@/lib/health/types";

export type HealthRole = HealthRoleType;
export type StaffRecord = any;
export type HealthStaffRecord = any;
export type HealthFacility = any;
export type StaffInvitation = any;
export type AttendanceRecord = any;
export type PayrollRecord = any;
export type OnboardingStatus = any;
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export class HealthRoleService {
  static async getRoles(): Promise<HealthRole[]> {
    return [];
  }
}
