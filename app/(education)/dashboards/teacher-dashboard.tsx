// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import {
  Users, ClipboardList, CheckCircle, MessageSquare, BookOpen, ChevronRight, Plus
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function TeacherDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getTeacherByUserId, getTeacherClasses, getTeacherAssignments, getPendingSubmissions, getMessages } = useEducation();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const t = await getTeacherByUserId(user.id);
      if (!t) { setLoading(false); return; }
      setTeacherId(t.id);
      const [c, a, p, m] = await Promise.all([
        getTeacherClasses(t.id),
        getTeacherAssignments(t.id),
        getPendingSubmissions(t.id),
        getMessages({ receiver_id: t.user_id }),
      ]);
      setClasses(c.slice(0, 3));
      setAssignments(a.slice(0, 3));
      setPending(p.slice(0, 3));
      setMessages(m.slice(0, 3));
    } catch (e) { console.error('[TeacherDashboard]', e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const Section = ({ icon: Icon, title, color, children, onPress, actionLabel }: any) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronRight size={16} color="#475569" />
      </TouchableOpacity>
      {children}
      {actionLabel && (
        <TouchableOpacity style={styles.actionRow} onPress={onPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Workspace</Text>
        <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Teacher'}</Text>
      </View>

      <Section icon={Users} title="My Classes" color="#38bdf8" onPress={() => router.push('/(education as any)/classes' as any)} actionLabel="View All Classes">
        {classes.length === 0 ? (
          <Text style={styles.empty}>No classes assigned</Text>
        ) : (
          classes.map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={styles.rowTitle}>{c.name || 'Class'}</Text>
              <Text style={styles.rowMeta}>{c.grade_level || ''} · {c.student_count || 0} students</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={ClipboardList} title="Assignments" color="#a78bfa" onPress={() => router.push('/(education as any)/assignments' as any)} actionLabel="Manage Assignments">
        {assignments.length === 0 ? (
          <Text style={styles.empty}>No active assignments</Text>
        ) : (
          assignments.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowTitle}>{a.title || 'Assignment'}</Text>
              <Text style={styles.rowMeta}>Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={CheckCircle} title="Pending Submissions" color="#fbbf24" onPress={() => router.push('/(education as any)/assignments' as any)} actionLabel="Review Submissions">
        {pending.length === 0 ? (
          <Text style={styles.empty}>No pending submissions</Text>
        ) : (
          pending.map((s, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowTitle}>Submission #{i + 1}</Text>
              <Text style={styles.rowMeta}>Awaiting review</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={BookOpen} title="Mark Attendance" color="#34d399" onPress={() => router.push('/(education as any)/attendance' as any)} actionLabel="Take Attendance">
        <Text style={styles.empty}>Tap to mark attendance for your classes today.</Text>
      </Section>

      <Section icon={MessageSquare} title="Messages" color="#f472b6" onPress={() => router.push('/(education as any)/messages' as any)} actionLabel="Open Messages">
        {messages.length === 0 ? (
          <Text style={styles.empty}>No new messages</Text>
        ) : (
          messages.map((m) => (
            <View key={m.id} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{m.content || 'Message'}</Text>
              <Text style={styles.rowMeta}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </Section>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(education as any)/assignments/create' as any)}>
        <Plus size={24} color="#0f172a" />
      </TouchableOpacity>
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
  actionRow: { padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#38bdf8', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', elevation: 4 },
});