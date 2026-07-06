import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceRecord {
  id: string;
  staff_id: string;
  user_full_name: string;
  role: string;
  facility_name: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
  notes: string | null;
  hours_worked: number | null;
}

export default function HRAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0, total: 0 });

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  async function loadAttendance() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_attendance')
        .select('*, health_staff(role, facility_id, health_facilities(name)), user_profiles:staff_id(email, full_name)')
        .eq('date', selectedDate)
        .order('clock_in', { ascending: true });

      if (error) throw error;

      const mapped: AttendanceRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        user_full_name: r.user_profiles?.full_name || 'Unknown',
        role: r.health_staff?.role || 'Unknown',
        facility_name: r.health_staff?.health_facilities?.name || 'Unknown',
        date: r.date,
        clock_in: r.clock_in,
        clock_out: r.clock_out,
        status: r.status,
        notes: r.notes,
        hours_worked: r.hours_worked,
      }));

      setRecords(mapped);
      setStats({
        present: mapped.filter(r => r.status === 'present').length,
        absent: mapped.filter(r => r.status === 'absent').length,
        late: mapped.filter(r => r.status === 'late').length,
        onLeave: mapped.filter(r => r.status === 'on_leave').length,
        total: mapped.length,
      });
    } catch (err) {
      console.error('Attendance load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markStatus(staffId: string, status: AttendanceRecord['status']) {
    const { error } = await supabase
      .from('health_attendance')
      .upsert({ staff_id: staffId, date: selectedDate, status, updated_at: new Date().toISOString() })
      .eq('staff_id', staffId)
      .eq('date', selectedDate);
    if (!error) loadAttendance();
  }

  const statusConfig = {
    present: { color: '#22c55e', icon: 'checkmark-circle' },
    absent: { color: '#ef4444', icon: 'close-circle' },
    late: { color: '#f59e0b', icon: 'time' },
    on_leave: { color: '#8b5cf6', icon: 'airplane' },
    half_day: { color: '#3b82f6', icon: 'sunny' },
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {dates.map(date => (
          <TouchableOpacity
            key={date}
            style={[styles.dateChip, selectedDate === date && styles.dateChipActive]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[styles.dateDay, selectedDate === date && styles.dateDayActive]}>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dateNum, selectedDate === date && styles.dateNumActive]}>
              {new Date(date).getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#ef444420' }]}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#8b5cf620' }]}>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.onLeave}</Text>
          <Text style={styles.statLabel}>On Leave</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{item.user_full_name}</Text>
                  <Text style={styles.cardRole}>{item.role} — {item.facility_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status].color + '20' }]}>
                  <Ionicons name={statusConfig[item.status].icon as any} size={14} color={statusConfig[item.status].color} />
                  <Text style={[styles.statusText, { color: statusConfig[item.status].color }]}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>Clock In: {item.clock_in ? new Date(item.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                <Text style={styles.timeText}>Clock Out: {item.clock_out ? new Date(item.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                {item.hours_worked && <Text style={styles.timeText}>Hours: {item.hours_worked.toFixed(1)}</Text>}
              </View>
              <View style={styles.actionRow}>
                {(['present', 'absent', 'late', 'on_leave', 'half_day'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.miniBtn, item.status === s && { backgroundColor: statusConfig[s].color }]}
                    onPress={() => markStatus(item.staff_id, s)}
                  >
                    <Text style={[styles.miniBtnText, item.status === s && { color: '#fff' }]}>
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No attendance records for {selectedDate}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  dateScroll: { marginTop: 8 },
  dateChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', marginRight: 8 },
  dateChipActive: { backgroundColor: '#0ea5e9' },
  dateDay: { fontSize: 11, color: '#94a3b8' },
  dateDayActive: { color: '#fff' },
  dateNum: { fontSize: 18, fontWeight: '700', color: '#e2e8f0', marginTop: 2 },
  dateNumActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  timeText: { fontSize: 12, color: '#64748b' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  miniBtnText: { fontSize: 11, color: '#94a3b8' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
