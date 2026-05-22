import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ClockShell() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const alarms = [
    { id: 1, time: '06:00', label: 'Morning Workout', active: true },
    { id: 2, time: '08:30', label: 'Work Start', active: true },
    { id: 3, time: '22:00', label: 'Sleep', active: false },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.clockFace}>
        <Text style={styles.timeText}>
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </Text>
        <Text style={styles.dateText}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTextActive}>Alarm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>World Clock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Timer</Text>
        </TouchableOpacity>
      </View>
      {alarms.map(alarm => (
        <View key={alarm.id} style={styles.alarmRow}>
          <View>
            <Text style={styles.alarmTime}>{alarm.time}</Text>
            <Text style={styles.alarmLabel}>{alarm.label}</Text>
          </View>
          <View style={[styles.toggle, alarm.active && styles.toggleActive]}>
            <View style={[styles.toggleDot, alarm.active && styles.toggleDotActive]} />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addAlarm}>
        <Ionicons name="add" size={24} color="#6366F1" />
        <Text style={styles.addAlarmText}>Add Alarm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  clockFace: { alignItems: 'center', paddingVertical: 40 },
  timeText: { fontSize: 56, fontWeight: '200', color: 'white', fontVariant: ['tabular-nums'] },
  dateText: { color: '#94A3B8', fontSize: 16, marginTop: 8 },
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { color: '#94A3B8', fontSize: 14 },
  tabTextActive: { color: 'white', fontWeight: '600', fontSize: 14 },
  alarmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
  alarmTime: { color: 'white', fontSize: 28, fontWeight: '300' },
  alarmLabel: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', paddingHorizontal: 4 },
  toggleActive: { backgroundColor: '#6366F1' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
  toggleDotActive: { alignSelf: 'flex-end' },
  addAlarm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8 },
  addAlarmText: { color: '#6366F1', fontSize: 16 },
});
