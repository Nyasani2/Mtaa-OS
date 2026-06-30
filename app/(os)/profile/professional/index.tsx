import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ProfProfile { id: string; job_title: string; company: string | null; industry: string | null; years_experience: number; skills: string[]; bio: string | null; linkedin_url: string | null; portfolio_url: string | null; is_public: boolean; }

export default function ProfessionalIndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from('professional_profiles').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="briefcase" size={48} color="#334155" />
          <Text style={styles.emptyTitle}>No Professional Profile</Text>
          <Text style={styles.emptySub}>Set up your professional profile to showcase your career</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/profile/professional/edit')}><Text style={styles.createBtnText}>Create Profile</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Professional</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/professional/edit')}><Ionicons name="create-outline" size={22} color="#3b82f6" /></TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.jobTitle}>{profile.job_title}</Text>
        {profile.company && <Text style={styles.company}>{profile.company}</Text>}
        {profile.industry && <Text style={styles.industry}>{profile.industry}</Text>}
        <View style={styles.expBadge}><Text style={styles.expText}>{profile.years_experience} years experience</Text></View>
      </View>
      {profile.bio && <View style={styles.section}><Text style={styles.sectionTitle}>Bio</Text><Text style={styles.bioText}>{profile.bio}</Text></View>}
      {profile.skills && profile.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {profile.skills.map((skill, i) => <View key={i} style={styles.skillChip}><Text style={styles.skillText}>{skill}</Text></View>)}
          </View>
        </View>
      )}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/professional/dashboard')}>
          <Ionicons name="stats-chart" size={20} color="#3b82f6" /><Text style={styles.actionText}>Career Dashboard</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  createBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1e293b', margin: 16, padding: 20, borderRadius: 12 },
  jobTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  company: { fontSize: 15, color: '#94a3b8', marginTop: 4 },
  industry: { fontSize: 13, color: '#64748b', marginTop: 2 },
  expBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 12 },
  expText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 10 },
  bioText: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  skillText: { color: '#cbd5e1', fontSize: 13 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 10 },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12, fontWeight: '500' },
});
