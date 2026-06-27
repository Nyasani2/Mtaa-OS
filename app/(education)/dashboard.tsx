import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
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

      const { data: teacher } = await supabase
        .from('education_teachers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (teacher) { setRole('teacher'); router.replace('/education/teacher-dashboard'); return; }

      const { data: student } = await supabase
        .from('education_students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (student) { setRole('student'); router.replace('/education/student-dashboard'); return; }

      const { data: parent } = await supabase
        .from('education_parent_connections')
        .select('id')
        .eq('parent_id', userId)
        .maybeSingle();
      if (parent) { setRole('parent'); router.replace('/education/parent-dashboard'); return; }

      setRole('student');
      router.replace('/education/student-dashboard');
    } catch (err: any) {
      console.error('Role detection error:', err);
      setError(err.message || 'Failed to detect role');
      router.replace('/education/student-dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.text}>Detecting your role...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.text}>Redirecting to {role} dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', fontSize: 16, marginTop: 16 },
  errorText: { color: '#ff4444', fontSize: 14, marginBottom: 8, textAlign: 'center' },
});
