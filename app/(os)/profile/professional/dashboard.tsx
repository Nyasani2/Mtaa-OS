import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user?.id) return; supabase.from('profiles').select('profession, skills, experience_years, languages').eq('user_id', user.id).single().then(({ data }) => { setProfile(data); setLoading(false); }); }, [user?.id]);
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const sections = [
    { label: 'Resume / CV', icon: 'document-text-outline', route: '/profile/professional/resume' },
    { label: 'Portfolio', icon: 'images-outline', route: '/profile/professional/portfolio' },
    { label: 'Certificates', icon: 'ribbon-outline', route: '/profile/professional/certificates' },
    { label: 'Experience', icon: 'time-outline', route: '/profile/professional/experience' },
    { label: 'Skills', icon: 'hammer-outline', route: '/profile/professional/skills' },
    { label: 'Recommendations', icon: 'thumbs-up-outline', route: '/profile/professional/recommendations' },
    { label: 'QR Resume', icon: 'qr-code-outline', route: '/profile/qr' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.profession}>{profile?.profession || 'No profession set'}</Text>
          <Text style={styles.experience}>{profile?.experience_years || 0} years experience</Text>
          {profile?.skills && <View style={styles.skillsRow}>{profile.skills.map((skill: string) => <View key={skill} style={styles.skillChip}><Text style={styles.skillText}>{skill}</Text></View>)}</View>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Tools</Text>
          {sections.map(s => <TouchableOpacity key={s.label} style={styles.row} onPress={() => router.push(s.route as any)}><Ionicons name={s.icon as any} size={20} color="#00ff88" /><Text style={styles.rowText}>{s.label}</Text><Ionicons name="chevron-forward" size={16} color="#444" /></TouchableOpacity>)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  summaryCard: { margin: 16, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  profession: { color: '#00ff88', fontSize: 18, fontWeight: '700' },
  experience: { color: '#888', fontSize: 13, marginTop: 4 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: { backgroundColor: '#00ff8822', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#00ff8844' },
  skillText: { color: '#00ff88', fontSize: 11 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
});
