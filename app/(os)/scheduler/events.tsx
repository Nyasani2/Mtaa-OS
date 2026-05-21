import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'hearing' | 'inspection' | 'other';
}

const typeColors = {
  meeting: '#1E40AF',
  hearing: '#059669',
  inspection: '#D97706',
  other: '#64748B',
};

const typeIcons = {
  meeting: 'users',
  hearing: 'gavel',
  inspection: 'search',
  other: 'calendar',
};

export default function SchedulerEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([
    { id: '1', title: 'Weekly Staff Meeting', date: '2026-05-22', time: '09:00', location: 'Conference Room A', type: 'meeting' },
    { id: '2', title: 'Case #4521 Hearing', date: '2026-05-23', time: '10:30', location: 'Courtroom 3', type: 'hearing' },
    { id: '3', title: 'Facility Inspection', date: '2026-05-24', time: '14:00', location: 'Block B', type: 'inspection' },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity>
          <FontAwesome5 name="plus" size={18} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventItem}>
            <View style={[styles.typeIcon, { backgroundColor: typeColors[event.type] + '15' }]}>
              <FontAwesome5 name={typeIcons[event.type]} size={16} color={typeColors[event.type]} />
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <FontAwesome5 name="calendar" size={10} color="#94A3B8" />
                <Text style={styles.metaText}>{event.date}</Text>
                <FontAwesome5 name="clock" size={10} color="#94A3B8" />
                <Text style={styles.metaText}>{event.time}</Text>
              </View>
              <View style={styles.eventMeta}>
                <FontAwesome5 name="map-marker-alt" size={10} color="#94A3B8" />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeColors[event.type] + '15' }]}>
              <Text style={[styles.typeText, { color: typeColors[event.type] }]}>{event.type}</Text>
            </View>
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
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: { fontSize: 11, color: '#94A3B8' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});
