import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface Alarm {
  id: string;
  time: string;
  label: string;
  repeat: string[];
  enabled: boolean;
}

export default function ClockAlarms() {
  const router = useRouter();
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: '1', time: '06:00', label: 'Morning Briefing', repeat: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], enabled: true },
    { id: '2', time: '07:30', label: 'Shift Start', repeat: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], enabled: true },
    { id: '3', time: '22:00', label: 'Night Lockdown', repeat: ['Daily'], enabled: false },
  ]);

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Alarms</Text>
        <TouchableOpacity>
          <FontAwesome5 name="plus" size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {alarms.map((alarm) => (
          <View key={alarm.id} style={styles.alarmItem}>
            <View style={styles.alarmLeft}>
              <Text style={[styles.alarmTime, !alarm.enabled && styles.disabled]}>{alarm.time}</Text>
              <Text style={styles.alarmLabel}>{alarm.label}</Text>
              <Text style={styles.alarmRepeat}>{alarm.repeat.join(', ')}</Text>
            </View>
            <Switch
              value={alarm.enabled}
              onValueChange={() => toggleAlarm(alarm.id)}
              trackColor={{ false: '#E2E8F0', true: '#FEF3C7' }}
              thumbColor={alarm.enabled ? '#F59E0B' : '#94A3B8'}
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
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alarmLeft: { flex: 1 },
  alarmTime: { fontSize: 32, fontWeight: '300', color: '#0F172A' },
  disabled: { color: '#94A3B8' },
  alarmLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 4 },
  alarmRepeat: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
