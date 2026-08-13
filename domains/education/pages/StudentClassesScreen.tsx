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

interface ClassItem {
  id: string;
  name: string;
  grade_level: string;
  teacher_name: string;
  subject_name: string;
  schedule?: string;
  room?: string;
}

interface TimetableEntry {
  day: string;
  entries: { time: string; subject: string; room: string }[];
}

export default function StudentClassesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'timetable'>('classes');

  const fetchData = useCallback(async () => {
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('class_id')
        .eq('user_id', user?.id)
        .single();

      if (!student?.class_id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch class details with teacher and subject
      const { data: classData } = await supabase
        .from('education_classes')
        .select('id, name, grade_level, teacher:teacher_id(full_name), subject:subject_id(name), schedule, room')
        .eq('id', student.class_id)
        .single();

      if (classData) {
        setClasses([{
          id: classData.id,
          name: classData.name,
          grade_level: classData.grade_level,
          teacher_name: classData.teacher?.full_name || 'TBA',
          subject_name: classData.subject?.name || 'General',
          schedule: classData.schedule,
          room: classData.room,
        }]);
      }

      // Fetch timetable
      const { data: ttData } = await supabase
        .from('education_timetable')
        .select('day, start_time, end_time, subject:subject_id(name), room')
        .eq('class_id', student.class_id)
        .order('start_time', { ascending: true });

      const grouped: Record<string, any[]> = {};
      (ttData || []).forEach((entry: any) => {
        if (!grouped[entry.day]) grouped[entry.day] = [];
        grouped[entry.day].push({
          time: `${entry.start_time} - ${entry.end_time}`,
          subject: entry.subject?.name || 'General',
          room: entry.room || 'TBA',
        });
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      setTimetable(days.map((day: any) => ({
        day,
        entries: grouped[day] || [],
      })));
    } catch (e) {
      console.error('[StudentClasses]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Classes</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{classes.length} classes enrolled</Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'classes' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('classes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'classes' ? colors.primary : colors.textSecondary }]}>Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timetable' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('timetable')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'timetable' ? colors.primary : colors.textSecondary }]}>Timetable</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'classes' ? (
          classes.map((c: any) => (
            <View key={c.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="people" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Grade {c.grade_level} · {c.subject_name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>Teacher: {c.teacher_name}</Text>
              </View>
              {c.room && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>Room: {c.room}</Text>
                </View>
              )}
              {c.schedule && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>Schedule: {c.schedule}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          timetable.map((day: any) => (
            <View key={day.day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{day.day}</Text>
              {day.entries.length === 0 ? (
                <Text style={[styles.noClass, { color: colors.textSecondary }]}>No classes</Text>
              ) : (
                day.entries.map((entry, idx) => (
                  <View key={idx} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.entryTime, { color: colors.primary }]}>{entry.time}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.entrySubject, { color: colors.text }]}>{entry.subject}</Text>
                      <Text style={[styles.entryRoom, { color: colors.textSecondary }]}>{entry.room}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))
        )}
        {activeTab === 'classes' && classes.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes found</Text>
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { fontSize: 13, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  infoText: { fontSize: 13 },
  dayCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  dayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  noClass: { fontSize: 13, paddingVertical: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  entryTime: { fontSize: 13, fontWeight: '600', width: 100 },
  entrySubject: { fontSize: 14, fontWeight: '600' },
  entryRoom: { fontSize: 12, marginTop: 2 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
