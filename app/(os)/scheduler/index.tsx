import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';

const schedulerModules = [
  { id: 'calendar', label: 'Calendar', icon: 'calendar-alt', route: '/(os)/scheduler', color: '#8B5CF6', desc: 'Monthly/weekly/daily views' },
  { id: 'tasks', label: 'Tasks', icon: 'check-square', route: '/(os)/scheduler/tasks', color: '#059669', desc: 'To-do lists & priorities' },
  { id: 'reminders', label: 'Reminders', icon: 'bell', route: '/(os)/scheduler/reminders', color: '#D97706', desc: 'Recurring alerts' },
  { id: 'events', label: 'Events', icon: 'calendar-check', route: '/(os)/scheduler/events', color: '#1E40AF', desc: 'Create & manage events' },
];

export default function SchedulerIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scheduler</Text>
        <Text style={styles.subtitle}>Calendar, Tasks & Reminders</Text>
        <View style={styles.modulesGrid}>
          {schedulerModules.map((mod) => (
            <TouchableOpacity key={mod.id} style={[styles.moduleCard, { borderLeftColor: mod.color }]} onPress={() => router.push(mod.route as any)}>
              <View style={[styles.iconContainer, { backgroundColor: mod.color + '15' }]}>
                <FontAwesome5 name={mod.icon} size={24} color={mod.color} />
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              <Text style={styles.moduleDesc}>{mod.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.emptyToday}>
            <FontAwesome5 name="calendar-day" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>No events scheduled for today</Text>
            <TouchableOpacity style={styles.addEventBtn} onPress={() => router.push('/(os)/scheduler/events')}>
              <Text style={styles.addEventText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  moduleLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  moduleDesc: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  todaySection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 12 },
  emptyToday: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
  addEventBtn: { marginTop: 16, backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addEventText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
