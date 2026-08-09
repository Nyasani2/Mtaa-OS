import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

const TEACHER_ROUTES = ['teacher-workspace', 'verification', 'class-manager', 'safety-admin', 'test-builder', 'grade-book'];
const STUDENT_ROUTES = ['homework', 'attendance', 'report-card', 'student-classes', 'school-feed', 'test-taker', 'student-class-view'];
const PARENT_ROUTES = ['parent-dashboard', 'parent-transport', 'transport-map', 'parent-safety', 'parent-walking', 'child-detail'];
const ADMIN_ROUTES = ['institution-profile', 'institution-list', 'teacher-list', 'student-list', 'class-manager', 'verification-workflow', 'transport-admin', 'walking-admin', 'safety-admin', 'payroll', 'biometric'];
const MINISTRY_ROUTES = ['verification-workflow', 'institution-list', 'verification'];

export type EducationRole = 'super_admin' | 'ministry' | 'school_admin' | 'teacher' | 'parent' | 'student' | 'none';

export default function EducationLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

  const [roleChecked, setRoleChecked] = useState(false);
  const [userRole, setUserRole] = useState<EducationRole>('none');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/pin');
      return;
    }
    checkRole();
  }, [user, authLoading]);

  const checkRole = async () => {
    try {
      const userId = user?.id;
      if (!userId) { setRoleChecked(true); return; }

      // Parallel role detection — all indexed lookups
      const [
        { data: staff },
        { data: teachers },
        { data: students },
        { data: parents },
      ] = await Promise.all([
        supabase.from('education_staff').select('id, role, is_super_admin').eq('user_id', userId).eq('status', 'active').limit(1),
        supabase.from('education_teachers').select('id').eq('user_id', userId).eq('status', 'active').limit(1),
        supabase.from('education_students').select('id').eq('user_id', userId).eq('enrollment_status', 'active').limit(1),
        supabase.from('education_parent_guardians').select('id').eq('user_id', userId).eq('status', 'active').limit(1),
      ]);

      let role: EducationRole = 'none';

      if (staff && staff.length > 0) {
        const s = staff[0];
        if (s.is_super_admin) role = 'super_admin';
        else if (s.role === 'ministry') role = 'ministry';
        else role = 'school_admin';
      } else if (teachers && teachers.length > 0) {
        role = 'teacher';
      } else if (students && students.length > 0) {
        role = 'student';
      } else if (parents && parents.length > 0) {
        role = 'parent';
      }

      setUserRole(role);
      setRoleChecked(true);
    } catch (e) {
      console.error('[EducationLayout] Role check failed:', e);
      setUserRole('none');
      setRoleChecked(true);
    }
  };

  // Role-based route guards
  useEffect(() => {
    if (!roleChecked || !segments.length) return;
    const currentRoute = segments[segments.length - 1] || '';

    // Shared routes — all roles allowed
    const shared = ['', 'index', 'feed', 'african-feed', 'resource-detail', 'messages', 'settings', 'profile', 'search', 'notifications'];
    if (shared.includes(currentRoute)) return;

    // Role gate logic
    const isTeacherRoute = TEACHER_ROUTES.includes(currentRoute);
    const isStudentRoute = STUDENT_ROUTES.includes(currentRoute);
    const isParentRoute = PARENT_ROUTES.includes(currentRoute);
    const isAdminRoute = ADMIN_ROUTES.includes(currentRoute);
    const isMinistryRoute = MINISTRY_ROUTES.includes(currentRoute);

    if (userRole === 'student' && (isTeacherRoute || isParentRoute || isAdminRoute || isMinistryRoute)) {
      router.replace('/(education)/');
      return;
    }
    if (userRole === 'parent' && (isTeacherRoute || isStudentRoute || isAdminRoute || isMinistryRoute)) {
      router.replace('/(education)/parent-dashboard');
      return;
    }
    if (userRole === 'teacher' && (isParentRoute || isStudentRoute || isAdminRoute || isMinistryRoute)) {
      // Teachers can access some student routes for management
      if (!['school-feed', 'class-manager'].includes(currentRoute)) {
        router.replace('/(education)/teacher-workspace');
      }
      return;
    }
    if (userRole === 'school_admin' && (isMinistryRoute)) {
      // School admins can't access ministry-only routes
      router.replace('/(education)/institution-profile');
      return;
    }
    if (userRole === 'none') {
      // No role → redirect to discovery/onboarding
      router.replace('/(education)/');
      return;
    }
  }, [roleChecked, segments, userRole]);

  if (authLoading || !roleChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="feed" />
      <Stack.Screen name="school-feed" />
      <Stack.Screen name="african-feed" />
      <Stack.Screen name="homework" />
      <Stack.Screen name="teacher-workspace" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="student-classes" />
      <Stack.Screen name="resource-detail" />
      <Stack.Screen name="parent-dashboard" />
      <Stack.Screen name="parent-transport" />
      <Stack.Screen name="transport-map" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="class-manager" />
      <Stack.Screen name="safety-admin" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="report-card" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="payroll" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="institution-profile" />
      <Stack.Screen name="institution-list" />
      <Stack.Screen name="teacher-list" />
      <Stack.Screen name="student-list" />
      <Stack.Screen name="transport-admin" />
      <Stack.Screen name="transport-tracker" />
      <Stack.Screen name="qr-generator" />
      <Stack.Screen name="qr-scanner" />
      <Stack.Screen name="qr-identity" />
      <Stack.Screen name="test-builder" />
      <Stack.Screen name="test-taker" />
      <Stack.Screen name="test-exam" />
      <Stack.Screen name="grade-book" />
      <Stack.Screen name="lesson-planner" />
      <Stack.Screen name="walking-admin" />
      <Stack.Screen name="walking-parent" />
      <Stack.Screen name="walking-squad" />
      <Stack.Screen name="parent-safety" />
      <Stack.Screen name="parent-walking" />
      <Stack.Screen name="child-detail" />
      <Stack.Screen name="student-class-view" />
      <Stack.Screen name="student-attendance" />
      <Stack.Screen name="student-profile" />
      <Stack.Screen name="teacher-profile" />
      <Stack.Screen name="biometric" />
      <Stack.Screen name="verification-workflow" />
      <Stack.Screen name="assignment-detail" />
      <Stack.Screen name="assignment-list" />
      <Stack.Screen name="resource-library" />
      <Stack.Screen name="mtaa-tv" />
      <Stack.Screen name="teacher-marketplace" />
      <Stack.Screen name="student-detail" />
      <Stack.Screen name="attendance-history" />
      <Stack.Screen name="attendance-marking" />
      <Stack.Screen name="student-submission" />
    </Stack>
  );
}
