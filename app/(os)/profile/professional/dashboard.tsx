import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ job_applications: 0, interviews: 0, offers: 0, profile_views: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      const { count: apps } = await supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('applicant_id', user.id);
      const { count: views } = await supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('viewer_id', user.id);
      setStats({ job_applications: apps || 0, interviews: 0, offers: 0, profile_views: views || 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Applications', value: stats.job_applications, icon: 'document-text', color: '#3b82f6' },
    { label: 'Interviews', value: stats.interviews, icon: 'mic', color: '#10b981' },
    { label: 'Offers', value: stats.offers, icon: 'trophy', color: '#f59e0b' },
    { label: 'Profile Views', value: stats.profile_views, icon: 'eye', color: '#8b5cf6' },
  ];

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Career Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.statsGrid}>
        {statCards.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}><Ionicons name={stat.icon as any} size={24} color={stat.color} /></View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/jobs')}>
          <Ionicons name="search" size={20} color="#3b82f6" /><Text style={styles.actionText}>Find Jobs</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/professional/edit')}>
          <Ionicons name="create" size={20} color="#10b981" /><Text style={styles.actionText}>Edit Profile</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  statLabel: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 8 },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12, fontWeight: '500' },
});
