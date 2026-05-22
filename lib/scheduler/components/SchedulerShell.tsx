import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const events = [
  { id: 1, title: 'Team Standup', time: '09:00', duration: '30m', type: 'work' },
  { id: 2, title: 'Doctor Appointment', time: '14:00', duration: '1h', type: 'health' },
  { id: 3, title: 'Client Call', time: '16:00', duration: '45m', type: 'work' },
];

const typeColors: Record<string, string> = { work: '#6366F1', health: '#10B981', personal: '#F59E0B' };

export function SchedulerShell() {
  const [selectedDate, setSelectedDate] = useState(0);
  const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduler</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {dates.map((d, i) => (
          <TouchableOpacity key={i} style={[styles.dateChip, selectedDate === i && styles.dateChipActive]} onPress={() => setSelectedDate(i)}>
            <Text style={[styles.dateText, selectedDate === i && styles.dateTextActive]}>{d}</Text>
            <Text style={[styles.dayNum, selectedDate === i && styles.dateTextActive]}>{12 + i}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={events}
        keyExtractor={e => e.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <View style={[styles.timeLine, { backgroundColor: typeColors[item.type] }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTime}>{item.time}</Text>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDuration}>{item.duration}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  addBtn: { backgroundColor: '#6366F1', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateScroll: { maxHeight: 80, marginBottom: 8 },
  dateChip: { alignItems: 'center', padding: 10, marginRight: 8, borderRadius: 12, backgroundColor: '#1E293B', width: 56 },
  dateChipActive: { backgroundColor: '#6366F1' },
  dateText: { color: '#94A3B8', fontSize: 12 },
  dateTextActive: { color: 'white', fontWeight: 'bold' },
  dayNum: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  eventRow: { flexDirection: 'row', marginBottom: 12 },
  timeLine: { width: 4, borderRadius: 2, marginRight: 12 },
  eventContent: { flex: 1, backgroundColor: '#1E293B', padding: 14, borderRadius: 12 },
  eventTime: { color: '#6366F1', fontSize: 13, fontWeight: '600' },
  eventTitle: { color: 'white', fontSize: 15, fontWeight: '600', marginTop: 4 },
  eventDuration: { color: '#64748B', fontSize: 12, marginTop: 2 },
});
