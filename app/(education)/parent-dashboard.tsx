import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface Child {
  id: string;
  student_id: string;
  student_name: string;
  institution_name: string;
  grade: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: connections } = await supabase
        .from('education_parent_connections')
        .select('student_id')
        .eq('parent_id', user.id);

      if (connections && connections.length > 0) {
        const studentIds = connections.map(c => c.student_id);
        const { data: students } = await supabase
          .from('education_students')
          .select('id, full_name, institution_id, grade')
          .in('id', studentIds);

        if (students) {
          const enriched = await Promise.all(
            students.map(async (s) => {
              const { data: inst } = await supabase
                .from('education_institutions')
                .select('name')
                .eq('id', s.institution_id)
                .maybeSingle();
              return {
                id: s.id,
                student_id: s.id,
                student_name: s.full_name,
                institution_name: inst?.name || 'Unknown School',
                grade: s.grade || 'N/A',
              };
            })
          );
          setChildren(enriched);
        }
      }

      const { data: ann } = await supabase
        .from('education_feeds')
        .select('id, title, content, priority, created_at')
        .eq('target_audience', 'parents')
        .order('created_at', { ascending: false })
        .limit(5);
      if (ann) setAnnouncements(ann);
    } catch (err) {
      console.error('Parent dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Portal</Text>
        <Text style={styles.headerSub}>Monitor your children's progress</Text>
      </View>

      <View style={styles.quickRow}>
        <QuickAction icon="cash-outline" label="Pay Fees" onPress={() => router.push('/education/fees')} />
        <QuickAction icon="calendar-outline" label="Timetable" onPress={() => router.push('/education/timetable')} />
        <QuickAction icon="mail-outline" label="Messages" onPress={() => router.push('/education/messages')} />
        <QuickAction icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Children</Text>
        {children.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No children linked yet</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => {}}>
              <Text style={styles.linkBtnText}>Link Child Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map(child => (
            <TouchableOpacity key={child.id} style={styles.childCard} onPress={() => router.push(`/education/my-grades?studentId=${child.student_id}`)}>
              <View style={styles.childAvatar}>
                <Text style={styles.childInitial}>{child.student_name.charAt(0)}</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.student_name}</Text>
                <Text style={styles.childMeta}>{child.institution_name} · Grade {child.grade}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>School Announcements</Text>
        {announcements.length === 0 ? (
          <Text style={styles.emptyText}>No announcements</Text>
        ) : (
          announcements.map(a => (
            <View key={a.id} style={styles.annCard}>
              <View style={styles.annHeader}>
                <Text style={styles.annTitle}>{a.title}</Text>
                {a.priority === 'urgent' && <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>}
              </View>
              <Text style={styles.annContent} numberOfLines={2}>{a.content}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#00d4ff" />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#111', marginBottom: 8 },
  quickBtn: { alignItems: 'center', padding: 12 },
  quickLabel: { color: '#ccc', fontSize: 12, marginTop: 6 },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyBox: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 14 },
  linkBtn: { marginTop: 12, backgroundColor: '#00d4ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  linkBtnText: { color: '#000', fontWeight: '600' },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00d4ff', justifyContent: 'center', alignItems: 'center' },
  childInitial: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  childMeta: { color: '#888', fontSize: 13, marginTop: 2 },
  annCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  annTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  urgentBadge: { backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  urgentText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  annContent: { color: '#aaa', fontSize: 13, lineHeight: 18 },
});
