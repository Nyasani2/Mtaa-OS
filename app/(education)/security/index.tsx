// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, Shield, AlertTriangle, Eye, Plus, ChevronRight, Clock } from 'lucide-react-native';

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ incidents: 0, resolved: 0, open: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: incidentData } = await supabase
        .from("education_security_incidents").select("*").eq("institution_id", instId).order("created_at", { ascending: false }).limit(50);
      const { data: logData } = await supabase
        .from("education_access_logs").select("*").eq("institution_id", instId).order("created_at", { ascending: false }).limit(20);

      setIncidents(incidentData || []);
      setAccessLogs(logData || []);
      setStats({
        incidents: incidentData?.length || 0,
        resolved: (incidentData || []).filter((x: any) => x.status === 'resolved').length,
        open: (incidentData || []).filter((x: any) => x.status === 'open').length,
      });
    } catch (e: any) {
      console.error('[Security]', e);
      Alert.alert('Error', e.message || 'Failed to load security');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const resolveIncident = async (id: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_security_incidents").update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id }).eq("id", id);
      if (error) throw error;
      Alert.alert('Resolved', 'Incident marked as resolved'); load();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to resolve'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Security</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/security/create' as any)}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>Report</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.statValue}>{stats.incidents}</Text>
          <Text style={styles.statLabel}>Incidents</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.open}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <Shield size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Security Incidents</Text>
      {(incidents || []).map((i: any) => (
        <TouchableOpacity key={i.id} style={styles.card} onPress={() => router.push(`/(education as any)/security/${i.id}` as any)}>
          <View style={styles.cardRow}>
            <AlertTriangle size={18} color="#ef4444" />
            <Text style={styles.cardTitle}>{i.title || 'Incident'}</Text>
            <Text style={[styles.badge, i.severity === 'critical' ? styles.badgeCritical : i.severity === 'high' ? styles.badgeHigh : styles.badgeLow]}>{i.severity}</Text>
          </View>
          <Text style={styles.cardSub}>{i.description || 'No description'}</Text>
          <Text style={styles.cardSub}>Location: {i.location || 'N/A'} · {new Date(i.created_at).toLocaleDateString()}</Text>
          {i.status === 'open' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveIncident(i.id)}>
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          )}
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Recent Access Logs</Text>
      {(accessLogs || []).map((l: any) => (
        <View key={l.id} style={styles.card}>
          <View style={styles.cardRow}>
            <Eye size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{l.action || 'Access'}</Text>
            <Text style={styles.cardRole}>{l.user_type}</Text>
          </View>
          <Text style={styles.cardSub}>{l.details || 'No details'} · {new Date(l.created_at).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgeCritical: { backgroundColor: '#ef444420', color: '#ef4444' },
  badgeHigh: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  badgeLow: { backgroundColor: '#22c55e20', color: '#22c55e' },
  cardRole: { fontSize: 12, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  resolveBtn: { marginTop: 8, backgroundColor: '#22c55e', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  resolveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
