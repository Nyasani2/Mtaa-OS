import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject_name?: string;
  marked_by: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({ total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');

  const fetchAttendance = useCallback(async () => {
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!student?.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from('education_attendance')
        .select('date, status, subject:subject_id(name), marked_by:marked_by(full_name)')
        .eq('student_id', student.id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: AttendanceRecord[] = (data || []).map((r: any) => ({
        date: r.date,
        status: r.status,
        subject_name: r.subject?.name,
        marked_by: r.marked_by?.full_name || 'System',
      }));

      setRecords(mapped);

      const total = mapped.length;
      const present = mapped.filter((r: any) => r.status === 'present').length;
      const absent = mapped.filter((r: any) => r.status === 'absent').length;
      const late = mapped.filter((r: any) => r.status === 'late').length;
      const excused = mapped.filter((r: any) => r.status === 'excused').length;

      setSummary({
        total,
        present,
        absent,
        late,
        excused,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    } catch (e) {
      console.error('[Attendance]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  const onRefresh = () => { setRefreshing(true); fetchAttendance(); };

  const filtered = filter === 'all' ? records : records.filter((r: any) => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#059669';
      case 'absent': return '#DC2626';
      case 'late': return '#D97706';
      case 'excused': return '#2563EB';
      default: return '#9CA3AF';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'present': return '#ECFDF5';
      case 'absent': return '#FEE2E2';
      case 'late': return '#FEF3C7';
      case 'excused': return '#DBEAFE';
      default: return '#F3F4F6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Attendance</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{summary.rate}% attendance rate</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.present}</Text>
          <Text style={[styles.summaryLabel, { color: '#059669' }]}>Present</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{summary.absent}</Text>
          <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Absent</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.summaryValue, { color: '#D97706' }]}>{summary.late}</Text>
          <Text style={[styles.summaryLabel, { color: '#D97706' }]}>Late</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{summary.excused}</Text>
          <Text style={[styles.summaryLabel, { color: '#2563EB' }]}>Excused</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['all', 'present', 'absent', 'late', 'excused'] as const).map((f: any) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {filtered.map((r, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardDate, { color: colors.text }]}>
                  {new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                {r.subject_name && <Text style={[styles.cardSubject, { color: colors.textSecondary }]}>{r.subject_name}</Text>}
              </View>
              <View style={[styles.statusPill, { backgroundColor: getStatusBg(r.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
              </View>
            </View>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Marked by: {r.marked_by}</Text>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {filter !== 'all' ? filter : ''} records</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  filterBar: { maxHeight: 52, marginVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardDate: { fontSize: 14, fontWeight: '600' },
  cardSubject: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardMeta: { fontSize: 12, marginTop: 4 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
