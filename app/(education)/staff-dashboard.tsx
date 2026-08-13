// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface StaffInfo {
  role: string;
  department: string;
  institution_name: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState<StaffInfo | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data: staff } = await supabase
        .from('education_staff')
        .select('role, department, institution_id, education_institutions(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (staff) {
        setInfo({
          role: staff.role || 'Staff',
          department: staff.department || 'General',
          institution_name: (staff.education_institutions as any)?.name || 'Your School',
        });
      }

      const { data: taskData } = await supabase
        .from('education_tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5);

      setTasks(taskData || []);
    } catch (err) {
      console.error('[StaffDashboard] load error:', err);
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
        <Text style={styles.loadingText}>Loading staff dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {info?.role || 'Staff'}</Text>
        <Text style={styles.subGreeting}>{info?.institution_name}</Text>
        <Text style={styles.department}>{info?.department} Department</Text>
      </View>

      <Text style={styles.sectionTitle}>My Tasks</Text>
      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle" size={40} color="#6B7280" />
          <Text style={styles.emptyText}>No pending tasks</Text>
        </View>
      ) : (
        tasks.map((task: any) => (
          <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => router.push(`/(education as any)/tasks/${task.id}` as any)}>
            <Ionicons name="clipboard-outline" size={20} color="#8B5CF6" />
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDue}>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <ActionButton icon="calendar" label="My Schedule" onPress={() => router.push('/(education as any)/timetable' as any)} />
        <ActionButton icon="mail" label="Messages" onPress={() => router.push('/(education as any)/messages' as any)} />
        <ActionButton icon="person" label="My Profile" onPress={() => router.push('/(os as any)/profile' as any)} />
        <ActionButton icon="settings" label="Settings" onPress={() => router.push('/(os as any)/settings' as any)} />
      </View>
    </ScrollView>
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
  department: { fontSize: 13, color: '#8B5CF6', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#6B7280', marginTop: 8, fontSize: 13 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A',
    marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 10,
  },
  taskContent: { flex: 1, marginLeft: 12 },
  taskTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  taskDue: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  actionButton: {
    width: '47%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 11, color: '#D1D5DB', marginTop: 6, textAlign: 'center' },
});
