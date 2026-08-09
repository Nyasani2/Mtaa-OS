import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { supabase } from '@/lib/supabase';
import {
  BookOpen, Calendar, Award, Bell, ClipboardList, Clock, ChevronRight
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function StudentDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getStudentByUserId, getStudentAssignments, getStudentGrades, getStudentAttendance, getStudentTimetable, getAnnouncements } = useEducation();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const s = await getStudentByUserId(user.id);
      if (!s) { setLoading(false); return; }
      setStudentId(s.id);
      const [a, g, att, tt, ann] = await Promise.all([
        getStudentAssignments(s.id),
        getStudentGrades(s.id),
        getStudentAttendance(s.id),
        getStudentTimetable(s.id),
        getAnnouncements({ institution_id: institutionId || s.institution_id }),
      ]);
      setAssignments(a.slice(0, 3));
      setGrades(g.slice(0, 3));
      setAttendance(att.slice(0, 5));
      setTimetable(tt.slice(0, 5));
      setAnnouncements(ann.slice(0, 3));
    } catch (e) { console.error('[StudentDashboard]', e); }
    finally { setLoading(false); }
  }, [user?.id, institutionId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  const Section = ({ icon: Icon, title, color, children, onPress }: any) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronRight size={16} color="#475569" />
      </TouchableOpacity>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Portal</Text>
        <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Student'}</Text>
      </View>

      <Section icon={ClipboardList} title="My Assignments" color="#38bdf8" onPress={() => router.push('/education/assignments')}>
        {assignments.length === 0 ? (
          <Text style={styles.empty}>No pending assignments</Text>
        ) : (
          assignments.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowTitle}>{a.title || 'Assignment'}</Text>
              <Text style={styles.rowMeta}>{a.subject || 'General'} · {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No due date'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Award} title="My Grades" color="#fbbf24" onPress={() => router.push('/education/grades')}>
        {grades.length === 0 ? (
          <Text style={styles.empty}>No grades yet</Text>
        ) : (
          grades.map((g) => (
            <View key={g.id} style={styles.row}>
              <Text style={styles.rowTitle}>{g.subject || 'Subject'}</Text>
              <Text style={[styles.rowMeta, { color: '#fbbf24', fontWeight: '700' }]}>{g.score ?? g.grade ?? 'N/A'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Clock} title="Attendance" color="#34d399" onPress={() => router.push('/education/attendance')}>
        {attendance.length === 0 ? (
          <Text style={styles.empty}>No attendance records</Text>
        ) : (
          attendance.map((r, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowTitle}>{r.date ? new Date(r.date).toLocaleDateString() : 'Date'}</Text>
              <Text style={[styles.rowMeta, { color: r.status === 'present' ? '#34d399' : '#ef4444' }]}>{r.status || 'N/A'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Calendar} title="Timetable" color="#a78bfa" onPress={() => router.push('/education/timetable')}>
        {timetable.length === 0 ? (
          <Text style={styles.empty}>No timetable entries</Text>
        ) : (
          timetable.map((t, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowTitle}>{t.day || 'Day'} · {t.start_time || '?'} - {t.end_time || '?'}</Text>
              <Text style={styles.rowMeta}>{t.subject || 'Subject'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Bell} title="Announcements" color="#f87171" onPress={() => router.push('/education/announcements')}>
        {announcements.length === 0 ? (
          <Text style={styles.empty}>No announcements</Text>
        ) : (
          announcements.map((n) => (
            <View key={n.id} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{n.title || 'Announcement'}</Text>
              <Text style={styles.rowMeta}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  row: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  rowTitle: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { padding: 14, fontSize: 13, color: '#475569', fontStyle: 'italic' },
});
