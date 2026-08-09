import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface HomeworkItem {
  id: string;
  title: string;
  subject_name: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [studentIdentity, setStudentIdentity] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isParent, setIsParent] = useState(false);

  const fetchFeed = useCallback(async () => {
    setError(null);
    try {
      // Check roles
      const [{ data: teacherData }, { data: studentData }, { data: parentData }] = await Promise.all([
        supabase.from('education_teachers').select('id, verification_status').eq('user_id', user?.id).single(),
        supabase.from('education_students').select('id, institution_id, current_level, class_id, full_name').eq('user_id', user?.id).single(),
        supabase.from('education_students').select('id').eq('primary_guardian_id', user?.id).limit(1),
      ]);

      setIsTeacher(!!teacherData);
      setIsParent(!!parentData && parentData.length > 0);

      if (studentData) {
        setStudentIdentity(studentData);
        const institutionId = studentData.institution_id;
        const classId = studentData.class_id;
        const studentId = studentData.id;

        // Announcements
        const { data: annData } = await supabase
          .from('education_announcements')
          .select('id, title, content, created_at')
          .eq('institution_id', institutionId)
          .order('created_at', { ascending: false })
          .limit(5);
        setAnnouncements(annData || []);

        // Upcoming homework + submission status
        const { data: hwData } = await supabase
          .from('education_assignments')
          .select('id, title, due_date, subject:subject_id(name)')
          .eq('class_id', classId)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5);

        const hwItems: HomeworkItem[] = [];
        if (hwData && hwData.length > 0) {
          const ids = hwData.map((h: any) => h.id);
          const { data: subData } = await supabase
            .from('education_submissions')
            .select('assignment_id, status, score')
            .in('assignment_id', ids)
            .eq('student_id', studentId);

          const subMap = new Map(subData?.map((s: any) => [s.assignment_id, s]));
          for (const h of hwData) {
            const sub = subMap.get(h.id);
            hwItems.push({
              id: h.id,
              title: h.title,
              subject_name: h.subject?.name || 'General',
              due_date: h.due_date,
              status: sub?.status === 'graded' ? 'graded' : sub ? 'submitted' : 'pending',
            });
          }
        }
        setHomework(hwItems);
      } else if (teacherData) {
        setStudentIdentity({ full_name: 'Teacher Workspace', institution_id: teacherData.id });
      } else if (parentData && parentData.length > 0) {
        setStudentIdentity({ full_name: 'Parent Dashboard' });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load education feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your education feed...</Text>
      </View>
    );
  }

  if (error && !studentIdentity) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchFeed}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pendingCount = homework.filter(h => h.status === 'pending').length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Education</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          {studentIdentity?.full_name || 'My School'}
        </Text>
      </View>

      {/* My School Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="school" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My School</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(education)/homework')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}><Ionicons name="book" size={22} color="#D97706" /></View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Homework</Text>
            {pendingCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(education)/attendance')}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}><Ionicons name="calendar" size={22} color="#2563EB" /></View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(education)/report-card')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}><Ionicons name="trophy" size={22} color="#059669" /></View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Grades</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(education)/student-classes')}>
            <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}><Ionicons name="people" size={22} color="#7C3AED" /></View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>My Classes</Text>
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Announcements</Text>
            <TouchableOpacity onPress={() => router.push('/(education)/school-feed')}><Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>
          {announcements.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No announcements yet</Text>
          ) : (
            announcements.slice(0, 3).map(a => (
              <View key={a.id} style={[styles.listRow, { borderBottomColor: colors.border }]}>
                <Ionicons name="megaphone" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>{a.title}</Text>
                  <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>{a.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Upcoming Homework */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Upcoming Homework</Text>
            <TouchableOpacity onPress={() => router.push('/(education)/homework')}><Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>
          {homework.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No upcoming homework</Text>
          ) : (
            homework.slice(0, 3).map(h => (
              <TouchableOpacity key={h.id} style={[styles.listRow, { borderBottomColor: colors.border }]} onPress={() => router.push(`/(education)/homework?id=${h.id}`)}>
                <View style={[styles.statusDot, { backgroundColor: h.status === 'pending' ? '#EF4444' : h.status === 'submitted' ? '#3B82F6' : '#10B981' }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>{h.title}</Text>
                  <Text style={[styles.listMeta, { color: colors.textSecondary }]}>{h.subject_name} · Due {new Date(h.due_date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: h.status === 'pending' ? '#FEE2E2' : h.status === 'submitted' ? '#DBEAFE' : '#ECFDF5' }]}>
                  <Text style={[styles.pillText, { color: h.status === 'pending' ? '#DC2626' : h.status === 'submitted' ? '#2563EB' : '#059669' }]}>{h.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* African Education */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="globe" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>African Education</Text>
        </View>
        <TouchableOpacity style={[styles.discoveryCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(education)/african-feed')}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.discoveryTitle, { color: colors.text }]}>Discover Educational Content</Text>
            <Text style={[styles.discoverySub, { color: colors.textSecondary }]}>Lessons, videos, and resources from verified teachers.</Text>
            <View style={styles.tagRow}>
              {['Mathematics', 'Science', 'Languages'].map(t => (
                <View key={t} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}><Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text></View>
              ))}
            </View>
          </View>
          <Ionicons name="arrow-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Teacher CTA */}
      {isTeacher && (
        <View style={styles.section}>
          <TouchableOpacity style={[styles.teacherBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(education)/teacher-workspace')}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.teacherBtnText}>Create Educational Content</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Parent CTA */}
      {isParent && (
        <View style={styles.section}>
          <TouchableOpacity style={[styles.parentBtn, { backgroundColor: '#7C3AED' }]} onPress={() => router.push('/(education)/parent-dashboard')}>
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.teacherBtnText}>Parent Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  listTitle: { fontSize: 14, fontWeight: '600' },
  listMeta: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  discoveryCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  discoveryTitle: { fontSize: 15, fontWeight: '700' },
  discoverySub: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
  teacherBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  parentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  teacherBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
