// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function JobApplicationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('job_applications')
      .select(`id, status, applied_at, job:job_id (title, company, location)`)
      .eq('applicant_id', user.id)
      .order('applied_at', { ascending: false });
    
    if (!error && data) setApplications(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return '#22c55e';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} />}>
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No applications yet</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(jobs)')}>
              <Text style={styles.browseBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.map((app) => (
            <TouchableOpacity key={app.id} style={styles.card} onPress={() => router.push(`/(jobs)/detail?id=${app.job.id}`)}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.jobTitle}>{app.job?.title || 'Unknown Job'}</Text>
                  <Text style={styles.company}>{app.job?.company || 'Unknown Company'} • {app.job?.location}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</Text>
                </View>
              </View>
              <Text style={styles.date}>Applied: {new Date(app.applied_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12, marginBottom: 24 },
  browseBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  jobTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  company: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  date: { color: '#64748b', fontSize: 12 },
});
