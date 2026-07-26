import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStudentClasses } from '@/domains/education/hooks/useClassManager';
import { useStudentIdentity } from '@/domains/education/hooks/useStudentIdentity';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentClassViewScreen() {
  const { user } = useAuth();
  const { identity, loading: idLoading } = useStudentIdentity(user?.id);
  const { classes, loading, error, refresh } = useStudentClasses(identity?.student_id);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'mates'>('overview');
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Loading state
  if (idLoading || (loading && classes.length === 0)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your classes...</Text>
      </View>
    );
  }

  // Error state
  if (error && classes.length === 0) {
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

  // Empty state — no identity linked
  if (!identity?.student_id) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <FontAwesome5 name="id-card" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Student Identity Not Found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Your account is not linked to a student record. Contact your institution administrator.</Text>
      </View>
    );
  }

  // Empty state — no classes enrolled
  if (classes.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="school-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Not Enrolled in Any Classes</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>You haven't been enrolled in any classes yet. Your institution will add you soon.</Text>
      </View>
    );
  }

  const activeClass = classes.find(c => c.id === selectedClass) || classes[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Classes</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{classes.length} class{classes.length !== 1 ? 'es' : ''} enrolled</Text>
      </View>

      {/* Class Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classSelector} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {classes.map(cls => (
          <TouchableOpacity
            key={cls.id}
            style={[
              styles.classChip,
              { backgroundColor: selectedClass === cls.id ? colors.primary : colors.card, borderColor: colors.border },
              selectedClass === cls.id && { borderColor: colors.primary },
            ]}
            onPress={() => setSelectedClass(cls.id)}
          >
            <Text style={[styles.classChipText, { color: selectedClass === cls.id ? '#fff' : colors.text }]}>
              {cls.name}
            </Text>
            <Text style={[styles.classChipSub, { color: selectedClass === cls.id ? '#ffffffaa' : colors.textSecondary }]}>
              Grade {cls.grade_level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Class Detail */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Class Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <View style={[styles.gradeBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.gradeText, { color: colors.primary }]}>G{activeClass.grade_level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.className, { color: colors.text }]}>{activeClass.name}</Text>
              <Text style={[styles.classCode, { color: colors.textSecondary }]}>{activeClass.code || 'No code'} · {activeClass.academic_year}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeClass.current_enrollment}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="person" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeClass.teacher?.full_name?.split(' ')[0] || 'N/A'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Teacher</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeClass.room || 'N/A'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Room</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="business" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeClass.building || 'N/A'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Building</Text>
            </View>
          </View>

          {/* Fill Rate */}
          <View style={styles.fillSection}>
            <View style={styles.fillHeader}>
              <Text style={[styles.fillLabel, { color: colors.textSecondary }]}>Class Capacity</Text>
              <Text style={[styles.fillValue, { color: colors.text }]}>{activeClass.current_enrollment}/{activeClass.capacity}</Text>
            </View>
            <View style={styles.fillBarBg}>
              <View style={[
                styles.fillBar,
                {
                  width: `${Math.min((activeClass.current_enrollment / activeClass.capacity) * 100, 100)}%`,
                  backgroundColor: (activeClass.current_enrollment / activeClass.capacity) > 0.9 ? '#ef4444' : (activeClass.current_enrollment / activeClass.capacity) > 0.7 ? '#f59e0b' : '#22c55e',
                },
              ]} />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['overview', 'schedule', 'mates'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={[styles.tabContent, { backgroundColor: colors.card }]}>
            <View style={styles.overviewRow}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Academic Year</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{activeClass.academic_year}</Text>
              </View>
            </View>
            <View style={styles.overviewRow}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Term</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{activeClass.term}</Text>
              </View>
            </View>
            <View style={styles.overviewRow}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Class Teacher</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{activeClass.teacher?.full_name || 'Not assigned'}</Text>
                <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>{activeClass.teacher?.email || ''}</Text>
              </View>
            </View>
            <View style={styles.overviewRow}>
              <Ionicons name="people-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Assistant Teacher</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{activeClass.assistant_teacher?.full_name || 'Not assigned'}</Text>
              </View>
            </View>
            {activeClass.stream && (
              <View style={styles.overviewRow}>
                <Ionicons name="git-branch" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Stream</Text>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>{activeClass.stream}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <View style={[styles.tabContent, { backgroundColor: colors.card }]}>
            {(!activeClass.schedule || activeClass.schedule.length === 0) ? (
              <View style={styles.emptyTab}>
                <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No schedule available yet.</Text>
              </View>
            ) : (
              activeClass.schedule.map((slot, idx) => (
                <View key={idx} style={[styles.scheduleItem, { borderBottomColor: colors.border, borderBottomWidth: idx < activeClass.schedule.length - 1 ? 1 : 0 }]}>
                  <View style={[styles.dayDot, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.dayDotText, { color: colors.primary }]}>{DAYS[slot.day]?.slice(0, 3)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scheduleSubject, { color: colors.text }]}>{slot.subject_id || 'Subject'}</Text>
                    <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{slot.start_time} - {slot.end_time}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Classmates Tab */}
        {activeTab === 'mates' && (
          <View style={[styles.tabContent, { backgroundColor: colors.card }]}>
            <View style={styles.emptyTab}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>Classmate list coming soon.</Text>
              <Text style={[styles.emptyTabSub, { color: colors.textSecondary }]}>Contact your teacher for the class roster.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  classSelector: { maxHeight: 72, marginVertical: 8 },
  classChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, minWidth: 100, alignItems: 'center' },
  classChipText: { fontSize: 14, fontWeight: '700' },
  classChipSub: { fontSize: 11, marginTop: 2 },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  gradeBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  gradeText: { fontWeight: '800', fontSize: 14 },
  className: { fontSize: 18, fontWeight: '700' },
  classCode: { fontSize: 12, marginTop: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2 },
  fillSection: { marginTop: 4 },
  fillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fillLabel: { fontSize: 12 },
  fillValue: { fontSize: 12, fontWeight: '700' },
  fillBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 3 },
  tabBar: { flexDirection: 'row', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabContent: { borderRadius: 16, padding: 16 },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  overviewLabel: { fontSize: 12 },
  overviewValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  overviewSub: { fontSize: 12, marginTop: 1 },
  emptyTab: { alignItems: 'center', paddingVertical: 40 },
  emptyTabText: { marginTop: 12, fontSize: 14 },
  emptyTabSub: { marginTop: 4, fontSize: 12 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dayDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dayDotText: { fontWeight: '700', fontSize: 11 },
  scheduleSubject: { fontSize: 15, fontWeight: '600' },
  scheduleTime: { fontSize: 12, marginTop: 2 },
});
