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
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';

const { width } = Dimensions.get('window');

const TEACHER_ACTIONS = [
  { icon: 'calendar-check', label: 'Take Attendance', route: '/(education)/attendance-marking', color: '#22c55e' },
  { icon: 'file-document-edit', label: 'Grade Work', route: '/(education)/grade-book', color: '#f59e0b' },
  { icon: 'message-text', label: 'Message Parent', route: '/(education)/messages', color: '#8b5cf6' },
  { icon: 'help-circle', label: 'Create Quiz', route: '/(education)/test-builder', color: '#ec4899' },
  { icon: 'book-open-variant', label: 'Lesson Plan', route: '/(education)/lesson-planner', color: '#3b82f6' },
  { icon: 'clipboard-list', label: 'Assignments', route: '/(education)/assignment-list', color: '#14b8a6' },
  { icon: 'account-group', label: 'My Classes', route: '/(education)/class-manager', color: '#6366f1' },
  { icon: 'chart-bar', label: 'Reports', route: '/(education)/report-card', color: '#06b6d4' },
];

export default function TeacherDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    todayClasses, pendingGrading, unreadMessages,
    attendancePending, stats,
    loading, refreshing, refresh,
  } = useTeacherDashboard();

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
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Teacher Workspace</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.email?.split('@')[0] || 'Teacher'}</Text>
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

      {/* Alert Banner — Attendance Pending */}
      {attendancePending.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}
          onPress={() => router.push('/(education)/attendance-marking')}
        >
          <Ionicons name="alert-circle" size={20} color="#f59e0b" />
          <Text style={[styles.alertText, { color: '#f59e0b' }]}>
            Attendance not taken for {attendancePending.length} class{attendancePending.length > 1 ? 'es' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
            <Ionicons name="people" size={20} color="#3b82f6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.total_students || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Students</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#ef444420' }]}>
            <Ionicons name="warning" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{pendingGrading.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>To Grade</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e20' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.attendance_taken_today || 0}/{stats?.total_classes_today || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="trending-up" size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.class_avg || 0}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Class Avg</Text>
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {TEACHER_ACTIONS.map((action, i) => (
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

      {/* Today's Classes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Classes</Text>
          <TouchableOpacity onPress={() => router.push('/(education)/class-manager')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Manage</Text>
          </TouchableOpacity>
        </View>
        {todayClasses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes scheduled today</Text>
          </View>
        ) : (
          todayClasses.map((cls: any) => (
            <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.classLeft}>
                <Text style={[styles.classTime, { color: colors.primary }]}>{cls.start_time?.slice(0, 5)}</Text>
                <Text style={[styles.classDuration, { color: colors.textSecondary }]}>{cls.duration} min</Text>
              </View>
              <View style={styles.classDivider} />
              <View style={styles.classInfo}>
                <Text style={[styles.classSubject, { color: colors.text }]}>{cls.subject_name}</Text>
                <Text style={[styles.classMeta, { color: colors.textSecondary }]}>
                  {cls.class_name} · {cls.student_count} students
                </Text>
              </View>
              <View style={styles.classActions}>
                {!cls.attendance_taken && (
                  <TouchableOpacity
                    style={[styles.actionPill, { backgroundColor: '#22c55e' }]}
                    onPress={() => router.push(`/(education)/attendance-marking?class_id=${cls.id}`)}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Take</Text>
                  </TouchableOpacity>
                )}
                {cls.attendance_taken && (
                  <View style={[styles.actionPill, { backgroundColor: '#22c55e20' }]}>
                    <Ionicons name="checkmark" size={14} color="#22c55e" />
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Pending Grading */}
      <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Grading</Text>
          <TouchableOpacity onPress={() => router.push('/(education)/grade-book')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Grade Book</Text>
          </TouchableOpacity>
        </View>
        {pendingGrading.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#22c55e" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All caught up! Nothing to grade.</Text>
          </View>
        ) : (
          pendingGrading.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.gradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/(education)/student-submission?id=${item.id}`)}
            >
              <View style={styles.gradeLeft}>
                <Text style={[styles.gradeStudent, { color: colors.text }]}>{item.student_name}</Text>
                <Text style={[styles.gradeAssignment, { color: colors.textSecondary }]}>{item.assignment_title}</Text>
              </View>
              <View style={[styles.gradeDue, { backgroundColor: '#ef444420' }]}>
                <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                  {item.days_overdue > 0 ? `${item.days_overdue}d overdue` : 'Due'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  alertBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600' },
  statsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: { width: width * 0.24, borderRadius: 16, padding: 12, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: (width - 52) / 4, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  classCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  classLeft: { width: 60, alignItems: 'center' },
  classTime: { fontSize: 15, fontWeight: '700' },
  classDuration: { fontSize: 11, marginTop: 2 },
  classDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0', marginHorizontal: 12 },
  classInfo: { flex: 1 },
  classSubject: { fontSize: 15, fontWeight: '700' },
  classMeta: { fontSize: 12, marginTop: 2 },
  classActions: { marginLeft: 8 },
  actionPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  gradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  gradeLeft: { flex: 1 },
  gradeStudent: { fontSize: 14, fontWeight: '600' },
  gradeAssignment: { fontSize: 12, marginTop: 2 },
  gradeDue: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  emptyCard: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1 },
  emptyText: { marginTop: 10, fontSize: 13, textAlign: 'center' },
});
