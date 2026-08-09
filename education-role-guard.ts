import { supabase } from '@/lib/supabase';

export type EducationRole = 'student' | 'teacher' | 'head_teacher' | 'parent' | 'staff' | 'admin' | 'accountant' | null;

export interface RolePermissions {
  canViewStudents: boolean; canViewTeachers: boolean; canViewGrades: boolean;
  canEditGrades: boolean; canViewAttendance: boolean; canMarkAttendance: boolean;
  canViewAssignments: boolean; canCreateAssignments: boolean;
  canViewPayroll: boolean; canEditPayroll: boolean;
  canViewFees: boolean; canEditFees: boolean;
  canViewAnnouncements: boolean; canPostAnnouncements: boolean;
  canViewAdminPanel: boolean; canManageUsers: boolean; canViewReports: boolean;
  canViewEmergency: boolean; canTriggerEmergency: boolean;
  canViewCCTV: boolean; canViewBiometrics: boolean; canViewTransport: boolean;
  canViewCommandCenter: boolean; canInviteTeachers: boolean;
  canApprovePayroll: boolean; canManageStaff: boolean;
  canViewOwnChildren: boolean; canViewOwnClasses: boolean; canViewOwnProfile: boolean;
}

const PERMISSIONS: Record<NonNullable<EducationRole>, RolePermissions> = {
  student: {
    canViewStudents: false, canViewTeachers: true, canViewGrades: true, canEditGrades: false,
    canViewAttendance: true, canMarkAttendance: false, canViewAssignments: true, canCreateAssignments: false,
    canViewPayroll: false, canEditPayroll: false, canViewFees: false, canEditFees: false,
    canViewAnnouncements: true, canPostAnnouncements: false, canViewAdminPanel: false, canManageUsers: false,
    canViewReports: false, canViewEmergency: true, canTriggerEmergency: false,
    canViewCCTV: false, canViewBiometrics: false, canViewTransport: true, canViewCommandCenter: false,
    canInviteTeachers: false, canApprovePayroll: false, canManageStaff: false,
    canViewOwnChildren: false, canViewOwnClasses: true, canViewOwnProfile: true,
  },
  teacher: {
    canViewStudents: true, canViewTeachers: true, canViewGrades: true, canEditGrades: true,
    canViewAttendance: true, canMarkAttendance: true, canViewAssignments: true, canCreateAssignments: true,
    canViewPayroll: false, canEditPayroll: false, canViewFees: false, canEditFees: false,
    canViewAnnouncements: true, canPostAnnouncements: false, canViewAdminPanel: false, canManageUsers: false,
    canViewReports: true, canViewEmergency: true, canTriggerEmergency: false,
    canViewCCTV: false, canViewBiometrics: false, canViewTransport: false, canViewCommandCenter: false,
    canInviteTeachers: false, canApprovePayroll: false, canManageStaff: false,
    canViewOwnChildren: false, canViewOwnClasses: true, canViewOwnProfile: true,
  },
  head_teacher: {
    canViewStudents: true, canViewTeachers: true, canViewGrades: true, canEditGrades: true,
    canViewAttendance: true, canMarkAttendance: true, canViewAssignments: true, canCreateAssignments: true,
    canViewPayroll: true, canEditPayroll: false, canViewFees: true, canEditFees: false,
    canViewAnnouncements: true, canPostAnnouncements: true, canViewAdminPanel: true, canManageUsers: true,
    canViewReports: true, canViewEmergency: true, canTriggerEmergency: true,
    canViewCCTV: true, canViewBiometrics: true, canViewTransport: true, canViewCommandCenter: true,
    canInviteTeachers: true, canApprovePayroll: true, canManageStaff: true,
    canViewOwnChildren: false, canViewOwnClasses: true, canViewOwnProfile: true,
  },
  parent: {
    canViewStudents: false, canViewTeachers: false, canViewGrades: true, canEditGrades: false,
    canViewAttendance: true, canMarkAttendance: false, canViewAssignments: true, canCreateAssignments: false,
    canViewPayroll: false, canEditPayroll: false, canViewFees: true, canEditFees: false,
    canViewAnnouncements: true, canPostAnnouncements: false, canViewAdminPanel: false, canManageUsers: false,
    canViewReports: false, canViewEmergency: true, canTriggerEmergency: false,
    canViewCCTV: false, canViewBiometrics: false, canViewTransport: true, canViewCommandCenter: false,
    canInviteTeachers: false, canApprovePayroll: false, canManageStaff: false,
    canViewOwnChildren: true, canViewOwnClasses: false, canViewOwnProfile: true,
  },
  staff: {
    canViewStudents: false, canViewTeachers: false, canViewGrades: false, canEditGrades: false,
    canViewAttendance: true, canMarkAttendance: true, canViewAssignments: false, canCreateAssignments: false,
    canViewPayroll: false, canEditPayroll: false, canViewFees: false, canEditFees: false,
    canViewAnnouncements: true, canPostAnnouncements: false, canViewAdminPanel: false, canManageUsers: false,
    canViewReports: false, canViewEmergency: true, canTriggerEmergency: false,
    canViewCCTV: false, canViewBiometrics: false, canViewTransport: false, canViewCommandCenter: false,
    canInviteTeachers: false, canApprovePayroll: false, canManageStaff: false,
    canViewOwnChildren: false, canViewOwnClasses: false, canViewOwnProfile: true,
  },
  admin: {
    canViewStudents: true, canViewTeachers: true, canViewGrades: true, canEditGrades: true,
    canViewAttendance: true, canMarkAttendance: true, canViewAssignments: true, canCreateAssignments: true,
    canViewPayroll: true, canEditPayroll: true, canViewFees: true, canEditFees: true,
    canViewAnnouncements: true, canPostAnnouncements: true, canViewAdminPanel: true, canManageUsers: true,
    canViewReports: true, canViewEmergency: true, canTriggerEmergency: true,
    canViewCCTV: true, canViewBiometrics: true, canViewTransport: true, canViewCommandCenter: true,
    canInviteTeachers: true, canApprovePayroll: true, canManageStaff: true,
    canViewOwnChildren: false, canViewOwnClasses: false, canViewOwnProfile: true,
  },
  accountant: {
    canViewStudents: false, canViewTeachers: true, canViewGrades: false, canEditGrades: false,
    canViewAttendance: false, canMarkAttendance: false, canViewAssignments: false, canCreateAssignments: false,
    canViewPayroll: true, canEditPayroll: true, canViewFees: true, canEditFees: true,
    canViewAnnouncements: true, canPostAnnouncements: false, canViewAdminPanel: false, canManageUsers: false,
    canViewReports: true, canViewEmergency: false, canTriggerEmergency: false,
    canViewCCTV: false, canViewBiometrics: false, canViewTransport: false, canViewCommandCenter: false,
    canInviteTeachers: false, canApprovePayroll: true, canManageStaff: false,
    canViewOwnChildren: false, canViewOwnClasses: false, canViewOwnProfile: true,
  },
};

export function getPermissions(role: EducationRole): RolePermissions {
  if (!role) return PERMISSIONS.staff;
  return PERMISSIONS[role];
}

export function hasPermission(role: EducationRole, permission: keyof RolePermissions): boolean {
  return getPermissions(role)[permission];
}

export async function detectUserEducationRole(userId: string): Promise<{ role: EducationRole; profileId: string | null; institutionId: string | null }> {
  try {
    const checks = [
      { table: 'education_school_admins', role: 'admin' as EducationRole },
      { table: 'education_teachers', role: 'teacher' as EducationRole },
      { table: 'education_students', role: 'student' as EducationRole },
      { table: 'education_parents', role: 'parent' as EducationRole },
      { table: 'education_staff', role: 'staff' as EducationRole },
      { table: 'education_accountants', role: 'accountant' as EducationRole },
    ];

    for (const check of checks) {
      const { data, error } = await supabase
        .from(check.table)
        .select('id, institution_id, is_head_teacher')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) continue;
      if (data) {
        let role = check.role;
        if (check.table === 'education_teachers' && data.is_head_teacher === true) {
          role = 'head_teacher';
        }
        return { role, profileId: data.id, institutionId: data.institution_id };
      }
    }
    return { role: null, profileId: null, institutionId: null };
  } catch (e) {
    console.error('[RoleGuard] detect error:', e);
    return { role: null, profileId: null, institutionId: null };
  }
}
