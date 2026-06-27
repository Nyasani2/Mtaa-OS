import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationIndex() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    checkRoleAndRoute();
  }, [user]);

  async function checkRoleAndRoute() {
    const userId = user!.id;
    try {
      const { data: teacher } = await supabase
        .from('education_teachers').select('id').eq('user_id', userId).maybeSingle();
      if (teacher) { router.replace('/education/teacher-dashboard'); return; }

      const { data: student } = await supabase
        .from('education_students').select('id').eq('user_id', userId).maybeSingle();
      if (student) { router.replace('/education/student-dashboard'); return; }

      const { data: parent } = await supabase
        .from('education_parent_connections').select('id').eq('parent_id', userId).maybeSingle();
      if (parent) { router.replace('/education/parent-dashboard'); return; }

      router.replace('/education/student-dashboard');
    } catch {
      router.replace('/education/student-dashboard');
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00d4ff" />
      <Text style={styles.text}>Loading Education...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16, marginTop: 16 },
});
