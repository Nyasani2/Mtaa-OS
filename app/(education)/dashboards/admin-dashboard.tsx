// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import {
  Users, School, Shield, AlertTriangle, CreditCard, BookOpen, Bus, ChevronRight, BarChart3, Settings, Bell
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function AdminDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getTeachers, getStudents, getClasses, getStaff, getAnnouncements } = useEducation();
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, staff: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!institutionId) { setLoading(false); return; }
    try {
      const [t, s, c, st, a] = await Promise.all([
        getTeachers({ institution_id: institutionId }),
        getStudents({ institution_id: institutionId }),
        getClasses({ institution_id: institutionId }),
        getStaff({ institution_id: institutionId }),
        getAnnouncements({ institution_id: institutionId }),
      ]);
      setStats({ teachers: t.length, students: s.length, classes: c.length, staff: st.length });
      setAnnouncements(a.slice(0, 3));
    } catch (e) { console.error('[AdminDashboard]', e); }
    finally { setLoading(false); }
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);

  const StatCard = ({ icon: Icon, label, value, color, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderColor: color + '40' }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon: Icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIconWrap, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <ChevronRight size={14} color="#475569" />
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Portal</Text>
        <Text style={styles.headerSub}>Full School Management Access</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon={Users} label="Teachers" value={stats.teachers} color="#38bdf8" onPress={() => router.push('/(education as any)/participants' as any)} />
        <StatCard icon={School} label="Students" value={stats.students} color="#34d399" onPress={() => router.push('/(education as any)/participants' as any)} />
        <StatCard icon={BookOpen} label="Classes" value={stats.classes} color="#fbbf24" onPress={() => router.push('/(education as any)/classes' as any)} />
        <StatCard icon={Shield} label="Staff" value={stats.staff} color="#a78bfa" onPress={() => router.push('/(education as any)/participants' as any)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon={Users} label="Participants" color="#38bdf8" onPress={() => router.push('/(education as any)/participants' as any)} />
          <QuickAction icon={School} label="Schools" color="#34d399" onPress={() => router.push('/(education as any)/schools' as any)} />
          <QuickAction icon={BookOpen} label="Classes" color="#fbbf24" onPress={() => router.push('/(education as any)/classes' as any)} />
          <QuickAction icon={CreditCard} label="Fees" color="#fbbf24" onPress={() => router.push('/(education as any)/fees' as any)} />
          <QuickAction icon={BarChart3} label="Payroll" color="#a78bfa" onPress={() => router.push('/(education as any)/payroll' as any)} />
          <QuickAction icon={Bus} label="Transport" color="#34d399" onPress={() => router.push('/(education as any)/transport' as any)} />
          <QuickAction icon={AlertTriangle} label="Emergency" color="#ef4444" onPress={() => router.push('/(education as any)/emergency' as any)} />
          <QuickAction icon={Settings} label="Settings" color="#94a3b8" onPress={() => router.push('/(education as any)/settings' as any)} />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => router.push('/(education as any)/announcements' as any)}>
          <Bell size={18} color="#f87171" />
          <Text style={[styles.sectionTitle, { marginLeft: 10, flex: 1 }]}>Announcements</Text>
          <ChevronRight size={16} color="#475569" />
        </TouchableOpacity>
        {announcements.length === 0 ? (
          <Text style={styles.empty}>No announcements</Text>
        ) : (
          announcements.map((n) => (
            <View key={n.id} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{n.title || 'Announcement'}</Text>
              <Text style={styles.rowMeta}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 10 },
  statCard: { width: '47%', backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  statIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 },
  quickAction: { width: '47%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1e293b', gap: 8 },
  quickIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { flex: 1, fontSize: 13, color: '#e2e8f0', fontWeight: '500' },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  rowTitle: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { paddingVertical: 10, fontSize: 13, color: '#475569', fontStyle: 'italic' },
});

