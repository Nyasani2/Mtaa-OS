
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

export default function HeadTeacherDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Get institution ID from education_staff
      const { data: staff } = await supabase
        .from('education_staff')
        .select('institution_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const instId = staff?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      // Fetch stats in parallel
      const [
        { count: students },
        { count: teachers },
        { count: classes },
        { data: todayAttendance },
        { count: pending }
      ] = await Promise.all([
        supabase.from('education_students').select('*', { count: 'exact', head: true }).eq('institution_id', instId),
        supabase.from('education_teachers').select('*', { count: 'exact', head: true }).eq('institution_id', instId),
        supabase.from('education_classes').select('*', { count: 'exact', head: true }).eq('institution_id', instId),
        supabase.from('education_attendance').select('status').eq('institution_id', instId).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('education_approvals').select('*', { count: 'exact', head: true }).eq('institution_id', instId).eq('status', 'pending'),
      ]);

      const present = todayAttendance?.filter((a: any) => a.status === 'present').length || 0;
      const total = todayAttendance?.length || 1;

      setStats({
        totalStudents: students || 0,
        totalTeachers: teachers || 0,
        totalClasses: classes || 0,
        attendanceRate: Math.round((present / total) * 100),
        pendingApprovals: pending || 0,
      });

      // Recent activity
      const { data: recent } = await supabase
        .from('education_activity_log')
        .select('*')
        .eq('institution_id', instId)
        .order('created_at', { ascending: false })
        .limit(5);
      setActivities(recent || []);
    } catch (err) {
      console.error('[HeadTeacherDashboard] load error:', err);
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
        <Text style={styles.loadingText}>Loading head teacher dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, Head Teacher</Text>
        <Text style={styles.subGreeting}>School Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="people" label="Students" value={stats?.totalStudents || 0} color="#3B82F6" onPress={() => router.push('/(education as any)/school/students' as any)} />
        <StatCard icon="person" label="Teachers" value={stats?.totalTeachers || 0} color="#10B981" onPress={() => router.push('/(education as any)/school/teachers' as any)} />
        <StatCard icon="school" label="Classes" value={stats?.totalClasses || 0} color="#8B5CF6" onPress={() => router.push('/(education as any)/classes' as any)} />
        <StatCard icon="checkmark-circle" label="Attendance" value={`${stats?.attendanceRate || 0}%`} color="#F59E0B" onPress={() => router.push('/(education as any)/attendance' as any)} />
      </View>

      {/* Pending Approvals Alert */}
      {(stats?.pendingApprovals || 0) > 0 && (
        <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/(education as any)/school/approvals' as any)}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <Text style={styles.alertText}>{stats?.pendingApprovals} pending approval(s) require your attention</Text>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <ActionButton icon="calendar" label="Timetable" onPress={() => router.push('/(education as any)/timetable' as any)} />
        <ActionButton icon="clipboard" label="Exams" onPress={() => router.push('/(education as any)/exam' as any)} />
        <ActionButton icon="cash" label="Fees" onPress={() => router.push('/(education as any)/fees' as any)} />
        <ActionButton icon="bus" label="Transport" onPress={() => router.push('/(education as any)/transport-admin' as any)} />
        <ActionButton icon="shield-checkmark" label="Security" onPress={() => router.push('/(education as any)/security' as any)} />
        <ActionButton icon="notifications" label="Announcements" onPress={() => router.push('/(education as any)/announcements' as any)} />
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={40} color="#6B7280" />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        activities.map((act: any) => (
          <View key={act.id} style={styles.activityItem}>
            <Ionicons name="ellipse" size={8} color="#8B5CF6" />
            <View style={styles.activityContent}>
              <Text style={styles.activityDesc}>{act.description}</Text>
              <Text style={styles.activityTime}>{new Date(act.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, onPress }: { icon: string; label: string; value: number | string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
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
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444420',
    marginHorizontal: 16, marginVertical: 12, padding: 14, borderRadius: 10,
  },
  alertText: { flex: 1, color: '#EF4444', fontSize: 13, marginHorizontal: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  actionButton: {
    width: '30%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 11, color: '#D1D5DB', marginTop: 6, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#6B7280', marginTop: 8, fontSize: 13 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 },
  activityContent: { marginLeft: 10, flex: 1 },
  activityDesc: { color: '#D1D5DB', fontSize: 13 },
  activityTime: { color: '#6B7280', fontSize: 11, marginTop: 2 },
});

