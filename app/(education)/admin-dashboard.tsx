// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface AdminStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  pendingApprovals: number;
  activeEnrollments: number;
}

interface SchoolSummary {
  id: string;
  name: string;
  type: string;
  student_count: number;
  teacher_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [schools, setSchools] = useState<SchoolSummary[]>([]);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Get admin's institution
      const { data: admin } = await supabase
        .from('education_staff')
        .select('institution_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const instId = admin?.institution_id;

      // If super-admin (no specific institution), get all
      const institutionFilter = instId ? ['institution_id', 'eq', instId] : null;

      const baseQuery = (table: string) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true });
        if (institutionFilter) q = q.eq(institutionFilter[0], institutionFilter[2]);
        return q;
      };

      const [
        { count: schoolsCount },
        { count: studentsCount },
        { count: teachersCount },
        { count: staffCount },
        { count: pendingCount },
        { count: enrollmentsCount },
      ] = await Promise.all([
        baseQuery('education_institutions'),
        baseQuery('education_students'),
        baseQuery('education_teachers'),
        baseQuery('education_staff'),
        supabase.from('education_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        baseQuery('education_enrollments'),
      ]);

      setStats({
        totalSchools: schoolsCount || 0,
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalStaff: staffCount || 0,
        pendingApprovals: pendingCount || 0,
        activeEnrollments: enrollmentsCount || 0,
      });

      // Fetch school list
      const { data: schoolData } = await supabase
        .from('education_institutions')
        .select('id, name, type')
        .limit(10);

      if (schoolData) {
        const enriched = await Promise.all(
          schoolData.map(async (s) => {
            const { count: sc } = await supabase
              .from('education_students')
              .select('*', { count: 'exact', head: true })
              .eq('institution_id', s.id);
            const { count: tc } = await supabase
              .from('education_teachers')
              .select('*', { count: 'exact', head: true })
              .eq('institution_id', s.id);
            return { ...s, student_count: sc || 0, teacher_count: tc || 0 };
          })
        );
        setSchools(enriched);
      }
    } catch (err) {
      console.error('[AdminDashboard] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, Administrator</Text>
        <Text style={styles.subGreeting}>System Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="school" label="Schools" value={stats?.totalSchools || 0} color="#3B82F6" />
        <StatCard icon="people" label="Students" value={stats?.totalStudents || 0} color="#10B981" />
        <StatCard icon="person" label="Teachers" value={stats?.totalTeachers || 0} color="#8B5CF6" />
        <StatCard icon="briefcase" label="Staff" value={stats?.totalStaff || 0} color="#F59E0B" />
      </View>

      {/* Enrollment & Approvals */}
      <View style={styles.rowCards}>
        <TouchableOpacity style={[styles.rowCard, { backgroundColor: '#1A1A1A' }]} onPress={() => router.push('/(education as any)/enrollments' as any)}>
          <Ionicons name="clipboard" size={24} color="#10B981" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.rowValue}>{stats?.activeEnrollments || 0}</Text>
            <Text style={styles.rowLabel}>Active Enrollments</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rowCard, { backgroundColor: '#1A1A1A' }]} onPress={() => router.push('/(education as any)/approvals' as any)}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.rowValue, { color: '#EF4444' }]}>{stats?.pendingApprovals || 0}</Text>
            <Text style={styles.rowLabel}>Pending Approvals</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.actionsGrid}>
        <ActionButton icon="school" label="Schools" onPress={() => router.push('/(education as any)/schools' as any)} />
        <ActionButton icon="people" label="Students" onPress={() => router.push('/(education as any)/students' as any)} />
        <ActionButton icon="person" label="Teachers" onPress={() => router.push('/(education as any)/teachers' as any)} />
        <ActionButton icon="briefcase" label="Staff" onPress={() => router.push('/(education as any)/staff' as any)} />
        <ActionButton icon="cash" label="Fees" onPress={() => router.push('/(education as any)/fees' as any)} />
        <ActionButton icon="settings" label="Settings" onPress={() => router.push('/(education as any)/settings' as any)} />
      </View>

      {/* Schools List */}
      <Text style={styles.sectionTitle}>Schools</Text>
      {schools.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={40} color="#6B7280" />
          <Text style={styles.emptyText}>No schools found</Text>
        </View>
      ) : (
        schools.map((school: any) => (
          <TouchableOpacity
            key={school.id}
            style={styles.schoolCard}
            onPress={() => router.push(`/(education as any)/schools/${school.id}` as any)}
          >
            <View style={styles.schoolIcon}>
              <Ionicons name="school" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.schoolContent}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolMeta}>{school.type} • {school.student_count} students • {school.teacher_count} teachers</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#8B5CF6" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },
  header: { padding: 20, paddingTop: 40 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subGreeting: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  statCard: {
    width: '47%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  rowCards: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 10 },
  rowCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 10,
  },
  rowValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  rowLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  actionButton: {
    width: '30%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 11, color: '#D1D5DB', marginTop: 6, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#6B7280', marginTop: 8, fontSize: 13 },
  schoolCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A',
    marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 10,
  },
  schoolIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF620', justifyContent: 'center', alignItems: 'center' },
  schoolContent: { flex: 1, marginLeft: 12 },
  schoolName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  schoolMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
});
