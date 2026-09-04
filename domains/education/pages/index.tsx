import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

export type EducationRole = 'super_admin' | 'ministry' | 'school_admin' | 'teacher' | 'parent' | 'student' | 'none';

/**
 * Smart Entry — every user lands on a screen built for their role.
 * 
 * Student → StudentDashboardScreen (Today's classes, pending tasks, stats)
 * Teacher → TeacherWorkspaceScreen (Classes today, pending grading)
 * Parent → ParentDashboardScreen (Child selector, bus ETA, grades)
 * School Admin → InstitutionProfileScreen (School overview, stats)
 * Ministry/Super Admin → AfricanFeedScreen (Continental view)
 * No role → AfricanFeedScreen with onboarding CTA
 */
export default function EducationEntry() {
  const { user, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();
  const [role, setRole] = useState<EducationRole>('none');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const detectRole = async () => {
      const userId = user.id;
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

      let detected: EducationRole = 'none';
      if (staff?.length) {
        if (staff[0].is_super_admin) detected = 'super_admin';
        else if (staff[0].role === 'ministry') detected = 'ministry';
        else detected = 'school_admin';
      } else if (teachers?.length) detected = 'teacher';
      else if (students?.length) detected = 'student';
      else if (parents?.length) detected = 'parent';

      setRole(detected);
      setChecking(false);
    };

    detectRole();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  switch (role) {
    case 'super_admin':
    case 'ministry':
      return <Redirect href="/(education)/african-feed" />;
    case 'school_admin':
      return <Redirect href="/(education)/institution-profile" />;
    case 'teacher':
      return <Redirect href="/(education)/teacher-workspace" />;
    case 'parent':
      return <Redirect href="/(education)/parent-dashboard" />;
    case 'student':
      return <Redirect href="/(education)/student-dashboard" />;
    case 'none':
    default:
      return <Redirect href="/(education)/african-feed" />;
  }
}
