import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStudentAttendance } from '@/domains/education/hooks/useAttendance';
import { useStudentIdentity } from '@/domains/education/hooks/useStudentIdentity';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const STATUS_COLORS: Record<string, string> = {
  present: '#22c55e', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6', early_departure: '#8b5cf6', medical: '#06b6d4',
};

const STATUS_ICONS: Record<string, string> = {
  present: 'checkmark-circle', absent: 'close-circle', late: 'time', excused: 'shield-checkmark', early_departure: 'exit', medical: 'medical',
};

export default function StudentAttendanceScreen() {
  const { user } = useAuth();
  const { identity, loading: idLoading } = useStudentIdentity(user?.id);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'term'>('week');

  const getDateFrom = () => {
    const d = new Date();
    if (dateRange === 'week') d.setDate(d.getDate() - 7);
    if (dateRange === 'month') d.setDate(d.getDate() - 30);
    if (dateRange === 'term') d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  };

  const { records, summary, loading, error, refresh } = useStudentAttendance(
    identity?.student_id,
    getDateFrom(),
    new Date().toISOString().split('T')[0]
  );

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Loading
  if (idLoading || (loading && !summary)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading attendance...</Text>
      </View>
    );
  }

  // Error
  if (error && !summary) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No identity
  if (!identity?.student_id) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <FontAwesome5 name="id-card" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Student Identity Required</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Your account is not linked to a student record.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Attendance</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{summary?.total_sessions || 0} sessions tracked</Text>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="trending-up" size={24} color="#22c55e" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.rate}%</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Attendance Rate</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.present}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.absent}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Absent</Text>
          </View>
        </View>
      )}

      {/* Streak */}
      {summary && summary.streak > 0 && (
        <View style={[styles.streakCard, { backgroundColor: '#f59e0b15' }]}>
          <Ionicons name="flame" size={24} color="#f59e0b" />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.streakValue, { color: '#f59e0b' }]}>{summary.streak} day streak</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Keep it up! Consistent attendance matters.</Text>
          </View>
        </View>
      )}

      {/* Date Range Selector */}
      <View style={[styles.rangeBar, { backgroundColor: colors.card }]}>
        {(['week', 'month', 'term'] as const).map((range: any) => (
          <TouchableOpacity
            key={range}
            style={[styles.rangeChip, dateRange === range && { backgroundColor: colors.primary }]}
            onPress={() => setDateRange(range)}
          >
            <Text style={[styles.rangeText, { color: dateRange === range ? '#fff' : colors.textSecondary }]}>
              {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'This Term'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attendance History */}
      <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance History</Text>
        {records.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>No attendance records in this period.</Text>
          </View>
        ) : (
          records.map((record, index) => {
            const statusColor = STATUS_COLORS[record.status] || '#6b7280';
            const statusIcon = STATUS_ICONS[record.status] || 'help-circle';
            return (
              <View key={record.id} style={[styles.historyRow, { borderBottomColor: colors.border, borderBottomWidth: index < records.length - 1 ? 1 : 0 }]}>
                <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
                  <Ionicons name={statusIcon as any} size={18} color={statusColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyStatus, { color: colors.text }]}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                  </Text>
                  <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                    {record.session?.topic || 'Attendance'} · {new Date(record.created_at).toLocaleDateString()}
                  </Text>
                  {record.check_in_time && (
                    <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                      Checked in: {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusPillText, { color: statusColor }]}>{record.status.charAt(0).toUpperCase()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700' },
  emptySub: { marginTop: 4, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  summaryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  streakCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12 },
  streakValue: { fontSize: 16, fontWeight: '700' },
  streakLabel: { fontSize: 12, marginTop: 2 },
  rangeBar: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 16, padding: 6, borderRadius: 12 },
  rangeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rangeText: { fontSize: 12, fontWeight: '600' },
  historyCard: { margin: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyHistory: { alignItems: 'center', paddingVertical: 32 },
  emptyHistoryText: { marginTop: 8, fontSize: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  statusIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  historyStatus: { fontSize: 14, fontWeight: '600' },
  historyMeta: { fontSize: 11, marginTop: 2 },
  historyTime: { fontSize: 11, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
});
