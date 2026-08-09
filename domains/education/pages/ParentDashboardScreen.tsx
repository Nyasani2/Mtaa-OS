import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useParentDashboard } from '../hooks/useParentDashboard';

const { width } = Dimensions.get('window');

const PARENT_ACTIONS = [
  { icon: 'bus', label: 'Track Bus', route: '/(education)/parent-transport', color: '#06b6d4' },
  { icon: 'message-text', label: 'Message Teacher', route: '/(education)/messages', color: '#8b5cf6' },
  { icon: 'file-document', label: 'Report Card', route: '/(education)/report-card', color: '#f59e0b' },
  { icon: 'calendar-check', label: 'Attendance', route: '/(education)/attendance', color: '#22c55e' },
  { icon: 'cash', label: 'Pay Fees', route: '/(education)/payroll', color: '#ec4899' },
  { icon: 'shield-check', label: 'Safety', route: '/(education)/parent-safety', color: '#ef4444' },
  { icon: 'qrcode', label: 'Child ID', route: '/(education)/qr-identity', color: '#6366f1' },
  { icon: 'school', label: 'School Feed', route: '/(education)/school-feed', color: '#14b8a6' },
];

export default function ParentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    children, selectedChild, selectChild,
    stats, busETA, busStatus,
    recentGrades, recentAttendance,
    loading, refreshing, refresh,
    unreadMessages,
  } = useParentDashboard();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Parent Portal</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.email?.split('@')[0] || 'Parent'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(education)/notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {unreadMessages > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childRow}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                {
                  backgroundColor: selectedChild?.id === child.id ? colors.primary : colors.card,
                  borderColor: selectedChild?.id === child.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => selectChild(child.id)}
            >
              <Text style={[
                styles.childChipText,
                { color: selectedChild?.id === child.id ? '#fff' : colors.text },
              ]}>
                {child.full_name}
              </Text>
              <Text style={[
                styles.childChipSub,
                { color: selectedChild?.id === child.id ? '#fff' + 'aa' : colors.textSecondary },
              ]}>
                {child.institution_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Selected Child Header */}
      {selectedChild && (
        <View style={[styles.childHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>{selectedChild.full_name.charAt(0)}</Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: colors.text }]}>{selectedChild.full_name}</Text>
            <Text style={[styles.childMeta, { color: colors.textSecondary }]}>
              {selectedChild.current_level} · {selectedChild.institution_name}
            </Text>
          </View>
          <View style={[styles.childStatus, { backgroundColor: selectedChild.status === 'at_school' ? '#22c55e20' : '#f59e0b20' }]}>
            <Text style={{ color: selectedChild.status === 'at_school' ? '#22c55e' : '#f59e0b', fontSize: 11, fontWeight: '700' }}>
              {selectedChild.status === 'at_school' ? 'At School' : selectedChild.status === 'on_bus' ? 'On Bus' : 'At Home'}
            </Text>
          </View>
        </View>
      )}

      {/* Bus ETA Card */}
      {busETA && (
        <TouchableOpacity
          style={[styles.busCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(education)/parent-transport')}
        >
          <View style={styles.busHeader}>
            <View style={[styles.busIcon, { backgroundColor: '#06b6d420' }]}>
              <Ionicons name="bus" size={24} color="#06b6d4" />
            </View>
            <View style={styles.busInfo}>
              <Text style={[styles.busTitle, { color: colors.text }]}>School Bus</Text>
              <Text style={[styles.busRoute, { color: colors.textSecondary }]}>{busETA.route_name}</Text>
            </View>
            <View style={[styles.busLiveBadge, { backgroundColor: '#ef444420' }]}>
              <View style={styles.liveDot} />
              <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View style={styles.etaBlock}>
              <Text style={[styles.etaValue, { color: colors.text }]}>{busETA.minutes}</Text>
              <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>min away</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaBlock}>
              <Text style={[styles.etaValue, { color: colors.text }]}>{busETA.stops_away}</Text>
              <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>stops away</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaBlock}>
              <Text style={[styles.etaValue, { color: colors.text }]}>{busETA.driver_name}</Text>
              <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>Driver</Text>
            </View>
          </View>

          {busStatus && (
            <View style={[styles.busStatusBar, { backgroundColor: busStatus === 'approaching' ? '#f59e0b20' : '#22c55e20' }]}>
              <Ionicons name={busStatus === 'approaching' ? 'time' : 'checkmark-circle'} size={16} color={busStatus === 'approaching' ? '#f59e0b' : '#22c55e'} />
              <Text style={{ color: busStatus === 'approaching' ? '#f59e0b' : '#22c55e', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                {busStatus === 'approaching' ? 'Bus is approaching your stop' : 'Child has boarded safely'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e20' }]}>
            <Ionicons name="calendar" size={20} color="#22c55e" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.attendance_rate || 0}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="trophy" size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.avg_grade || 0}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#ef444420' }]}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.pending_fees || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Fees</Text>
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {PARENT_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                <MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Grades */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Grades</Text>
          <TouchableOpacity onPress={() => router.push('/(education)/report-card')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentGrades.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent grades</Text>
          </View>
        ) : (
          recentGrades.map((grade: any) => (
            <View key={grade.id} style={[styles.gradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.gradeLeft}>
                <Text style={[styles.gradeSubject, { color: colors.text }]}>{grade.subject_name}</Text>
                <Text style={[styles.gradeType, { color: colors.textSecondary }]}>{grade.assessment_type}</Text>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: (grade.score >= 70 ? '#22c55e' : grade.score >= 50 ? '#f59e0b' : '#ef4444') + '20' }]}>
                <Text style={{ color: grade.score >= 70 ? '#22c55e' : grade.score >= 50 ? '#f59e0b' : '#ef4444', fontSize: 16, fontWeight: '800' }}>
                  {grade.score}%
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Attendance */}
      <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
        </View>
        <View style={[styles.attendanceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {recentAttendance.map((day: any, i: number) => (
            <View key={i} style={styles.attDay}>
              <View style={[styles.attDot, {
                backgroundColor: day.status === 'present' ? '#22c55e' : day.status === 'absent' ? '#ef4444' : '#f59e0b'
              }]} />
              <Text style={[styles.attLabel, { color: colors.textSecondary }]}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  childRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  childChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, minWidth: 120 },
  childChipText: { fontSize: 14, fontWeight: '700' },
  childChipSub: { fontSize: 11, marginTop: 2 },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 16, fontWeight: '700' },
  childMeta: { fontSize: 12, marginTop: 2 },
  childStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  busCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, borderWidth: 1 },
  busHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  busIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  busInfo: { flex: 1, marginLeft: 12 },
  busTitle: { fontSize: 16, fontWeight: '700' },
  busRoute: { fontSize: 12, marginTop: 2 },
  busLiveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  etaRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12 },
  etaBlock: { alignItems: 'center', flex: 1 },
  etaValue: { fontSize: 22, fontWeight: '800' },
  etaLabel: { fontSize: 11, marginTop: 2 },
  etaDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  busStatusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  statsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: { width: width * 0.32, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: (width - 52) / 4, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  gradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  gradeLeft: { flex: 1 },
  gradeSubject: { fontSize: 14, fontWeight: '600' },
  gradeType: { fontSize: 12, marginTop: 2 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderRadius: 14, borderWidth: 1 },
  attDay: { alignItems: 'center' },
  attDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 6 },
  attLabel: { fontSize: 11 },
  emptyCard: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1 },
  emptyText: { fontSize: 13, textAlign: 'center' },
});
