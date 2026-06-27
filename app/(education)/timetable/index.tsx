import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

interface TimetableSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_name: string;
  room: string;
  class_name: string;
}

export default function TimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const fetchTimetable = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('education_timetable')
      .select(`
        id, day, start_time, end_time, subject, room,
        classes:class_id(name),
        profiles:teacher_id(display_name)
      `)
      .eq('day', selectedDay)
      .eq('status', 'active')
      .order('start_time', { ascending: true });

    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      day: d.day,
      start_time: d.start_time,
      end_time: d.end_time,
      subject: d.subject,
      teacher_name: d.profiles?.display_name || 'TBD',
      room: d.room || 'TBD',
      class_name: d.classes?.name || '',
    }));

    setSlots(mapped);
    setLoading(false);
  }, [user?.id, selectedDay]);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timetable</Text>
        <TouchableOpacity onPress={() => router.push('/education/timetable/create')}>
          <Ionicons name="add-circle" size={24} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
              {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {slots.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No classes scheduled</Text>
            </View>
          ) : (
            slots.map(slot => (
              <View key={slot.id} style={styles.slotCard}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{slot.start_time}</Text>
                  <View style={styles.timeLine} />
                  <Text style={styles.timeText}>{slot.end_time}</Text>
                </View>
                <View style={styles.slotContent}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.subjectText}>{slot.subject}</Text>
                    <View style={styles.roomBadge}>
                      <Ionicons name="location-outline" size={12} color="#00d4ff" />
                      <Text style={styles.roomText}>{slot.room}</Text>
                    </View>
                  </View>
                  <Text style={styles.teacherText}>{slot.teacher_name}</Text>
                  {slot.class_name && <Text style={styles.classText}>{slot.class_name}</Text>}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dayScroll: { maxHeight: 50, paddingHorizontal: 16, paddingVertical: 10 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', marginRight: 8 },
  dayChipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  dayChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  dayChipTextActive: { color: '#00d4ff', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  slotCard: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  timeColumn: { alignItems: 'center', marginRight: 14 },
  timeText: { color: '#888', fontSize: 12, fontWeight: '600' },
  timeLine: { width: 2, height: 20, backgroundColor: '#333', marginVertical: 4 },
  slotContent: { flex: 1 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  roomBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4ff11', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  roomText: { color: '#00d4ff', fontSize: 11 },
  teacherText: { color: '#aaa', fontSize: 13, marginBottom: 2 },
  classText: { color: '#666', fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
});
