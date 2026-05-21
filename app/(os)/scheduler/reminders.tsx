import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface Reminder {
  id: string;
  title: string;
  time: string;
  repeat: string;
  enabled: boolean;
}

export default function SchedulerReminders() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Morning briefing', time: '08:00', repeat: 'Daily', enabled: true },
    { id: '2', title: 'Court session', time: '10:00', repeat: 'Weekdays', enabled: true },
    { id: '3', title: 'Cell inspection', time: '14:00', repeat: 'Daily', enabled: false },
  ]);

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity>
          <FontAwesome5 name="plus" size={18} color="#D97706" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderItem}>
            <View style={styles.reminderLeft}>
              <View style={[styles.timeCircle, { backgroundColor: reminder.enabled ? '#D97706' : '#CBD5E1' }]}>
                <Text style={styles.timeText}>{reminder.time}</Text>
              </View>
              <View>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderRepeat}>{reminder.repeat}</Text>
              </View>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={() => toggleReminder(reminder.id)}
              trackColor={{ false: '#E2E8F0', true: '#FEF3C7' }}
              thumbColor={reminder.enabled ? '#D97706' : '#94A3B8'}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  reminderRepeat: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
