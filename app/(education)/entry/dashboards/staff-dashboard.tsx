import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { supabase } from '@/lib/supabase';
import {
  Clock, MessageSquare, Bell, CalendarDays, ChevronRight, CheckCircle
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function StaffDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getAnnouncements, getMessages } = useEducation();
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: att } = await supabase
        .from('education_attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      setAttendanceToday(att);

      const [a, m] = await Promise.all([
        getAnnouncements({ institution_id: institutionId }),
        getMessages({ receiver_id: user.id }),
      ]);
      setAnnouncements(a.slice(0, 3));
      setMessages(m.slice(0, 3));
    } catch (e) { console.error('[StaffDashboard]', e); }
    finally { setLoading(false); }
  }, [user?.id, institutionId]);

  useEffect(() => { load(); }, [load]);

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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Portal</Text>
        <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Staff Member'}</Text>
      </View>

      <Section icon={Clock} title="My Attendance" color="#34d399" onPress={() => router.push('/education/attendance')}>
        {attendanceToday ? (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Today</Text>
            <Text style={[styles.rowMeta, { color: attendanceToday.status === 'present' ? '#34d399' : '#ef4444' }]}>
              {attendanceToday.status?.toUpperCase() || 'NOT MARKED'}
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={styles.empty}>Attendance not marked today</Text>
            <TouchableOpacity style={styles.markBtn} onPress={() => router.push('/education/attendance')}>
              <CheckCircle size={14} color="#0f172a" />
              <Text style={styles.markBtnText}>Mark Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </Section>

      <Section icon={MessageSquare} title="Messages" color="#f472b6" onPress={() => router.push('/education/messages')}>
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

      <Section icon={CalendarDays} title="Events" color="#a78bfa" onPress={() => router.push('/education/events')}>
        <Text style={styles.empty}>View upcoming school events and calendar.</Text>
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
  empty: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#38bdf8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  markBtnText: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
});
