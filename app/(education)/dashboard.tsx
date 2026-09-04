import React, { useState, useEffect } from 'react';

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    detectRole();
  }, [user]);

  async function detectRole() {
    setLoading(true);
    setError(null);
    try {
      const userId = user!.id;

      // Check all role tables in parallel
      const [
        { data: teacher },
        { data: student },
        { data: parent },
        { data: staff },
        { data: admin },
        { data: headTeacher },
        { data: accountant },
        { data: driver },
        { data: counsellor },
      ] = await Promise.all([
        supabase.from('education_teachers').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_students').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_parents').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_staff').select('id, role').eq('user_id', userId).maybeSingle(),
        supabase.from('education_admins').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_head_teachers').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_accountants').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_drivers').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('education_counsellors').select('id').eq('user_id', userId).maybeSingle(),
      ]);

      let detectedRole: string | null = null;

      if (admin) detectedRole = 'admin';
      else if (headTeacher) detectedRole = 'head_teacher';
      else if (teacher) detectedRole = 'teacher';
      else if (accountant) detectedRole = 'accountant';
      else if (staff) {
        const staffRole = (staff as any).role;
        if (staffRole === 'security') detectedRole = 'security';
        else if (staffRole === 'ict') detectedRole = 'ict';
        else if (staffRole === 'librarian') detectedRole = 'librarian';
        else detectedRole = 'staff';
      }
      else if (driver) detectedRole = 'driver';
      else if (counsellor) detectedRole = 'counsellor';
      else if (student) detectedRole = 'student';
      else if (parent) detectedRole = 'parent';

      setRole(detectedRole);
      setLoading(false);

      // Route based on role
      if (detectedRole === 'admin') router.replace('/(education)/admin-dashboard');
      else if (detectedRole === 'head_teacher') router.replace('/(education)/head-teacher-dashboard');
      else if (detectedRole === 'teacher') router.replace('/(education)/teacher-dashboard');
      else if (detectedRole === 'accountant') router.replace('/(education)/accountant-dashboard');
      else if (detectedRole === 'staff') router.replace('/(education)/staff-dashboard');
      else if (detectedRole === 'driver') router.replace('/(education)/driver');
      else if (detectedRole === 'counsellor') router.replace('/(education)/counsellor');
      else if (detectedRole === 'student') router.replace('/(education)/student-dashboard');
      else if (detectedRole === 'parent') router.replace('/(education)/parent-dashboard');
      else {
        // No role found — redirect to registration portal
        router.replace('/(education)/register');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect role');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.text}>Detecting your role...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to {role} dashboard...</Text>
      <ActivityIndicator size="small" color="#60a5fa" style={{ marginTop: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#e2e8f0', fontSize: 16, marginTop: 16 },
  errorText: { color: '#f87171', fontSize: 16, textAlign: 'center', padding: 20 },
});
