import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileProfessionalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cv, setCv] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) { setLoading(false); return; }
    const [{ data: cvData }, { data: skillsData }] = await Promise.all([
      supabase.from('user_cvs').select('*').eq('user_id', user.id).single(),
      supabase.from('profile_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setCv(cvData);
    setSkills(skillsData || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Professional</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
        <TouchableOpacity onPress={() => Alert.alert('Edit', 'CV builder coming soon')}>
          <Ionicons name="create-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        <TouchableOpacity style={styles.cvCard} onPress={() => router.push('/(work)/jobs/portfolio')}>
          <Ionicons name="document-text-outline" size={32} color="#2563EB" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cvTitle}>My CV / Resume</Text>
            <Text style={styles.cvSubtitle}>{cv ? 'Last updated recently' : 'No CV created yet'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Skills</Text>
        {skills.length === 0 ? (
          <Text style={styles.emptyText}>No skills added yet. Add skills to improve your job matches.</Text>
        ) : (
          <View style={styles.skillsGrid}>
            {skills.map(s => (
              <View key={s.id} style={styles.skillChip}>
                <Text style={styles.skillText}>{s.skill_name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(work)/jobs')}>
          <Ionicons name="briefcase-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Find Jobs</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cvCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cvTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cvSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginVertical: 20 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  skillText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 24, marginTop: 24, gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
