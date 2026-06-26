import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText, Stethoscope, Pill, FlaskConical, Scan,
  ChevronRight, Calendar, Clock, AlertCircle,
  Heart, Activity, TrendingUp, Filter
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface TimelineEvent {
  id: string;
  type: 'diagnosis' | 'prescription' | 'lab' | 'imaging' | 'vitals' | 'visit';
  title: string;
  subtitle: string;
  date: string;
  facility: string;
  doctor: string;
  status: string;
  details?: any;
}

export default function MedicalRecordScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'diagnosis' | 'prescription' | 'lab' | 'imaging' | 'vitals'>('all');
  const [loading, setLoading] = useState(false);

  const timelineEvents: TimelineEvent[] = [
    {
      id: '1', type: 'visit', title: 'Outpatient Consultation',
      subtitle: 'General checkup, routine follow-up',
      date: '2025-06-10T09:30:00Z', facility: 'Nairobi West Hospital',
      doctor: 'Dr. Sarah Kimani', status: 'completed'
    },
    {
      id: '2', type: 'diagnosis', title: 'Type 2 Diabetes Mellitus',
      subtitle: 'ICD-10: E11.9 | Primary diagnosis',
      date: '2025-06-10T09:45:00Z', facility: 'Nairobi West Hospital',
      doctor: 'Dr. Sarah Kimani', status: 'active'
    },
    {
      id: '3', type: 'prescription', title: 'Metformin 500mg',
      subtitle: '1 tablet twice daily for 30 days',
      date: '2025-06-10T10:00:00Z', facility: 'Nairobi West Hospital',
      doctor: 'Dr. Sarah Kimani', status: 'active'
    },
    {
      id: '4', type: 'lab', title: 'HbA1c Test',
      subtitle: 'Result: 7.2% | Reference: <5.7%',
      date: '2025-06-05T08:00:00Z', facility: 'Lancet Laboratories',
      doctor: 'Lab Tech: James Omondi', status: 'completed'
    },
    {
      id: '5', type: 'vitals', title: 'Vitals Recorded',
      subtitle: 'BP: 140/90 | HR: 78 | Temp: 36.5C',
      date: '2025-06-10T09:35:00Z', facility: 'Nairobi West Hospital',
      doctor: 'Nurse: Grace Muthoni', status: 'completed'
    },
    {
      id: '6', type: 'imaging', title: 'Chest X-Ray',
      subtitle: 'No abnormalities detected',
      date: '2025-05-20T14:00:00Z', facility: 'Nairobi Imaging Centre',
      doctor: 'Dr. Peter Njoroge', status: 'completed'
    },
  ];

  const filteredEvents = activeFilter === 'all'
    ? timelineEvents
    : timelineEvents.filter(e => e.type === activeFilter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'diagnosis': return Stethoscope;
      case 'prescription': return Pill;
      case 'lab': return FlaskConical;
      case 'imaging': return Scan;
      case 'vitals': return Activity;
      case 'visit': return FileText;
      default: return FileText;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'diagnosis': return '#F44336';
      case 'prescription': return '#FF9800';
      case 'lab': return '#9C27B0';
      case 'imaging': return '#2196F3';
      case 'vitals': return '#4CAF50';
      case 'visit': return '#607D8B';
      default: return '#999';
    }
  };

  const groupByDate = (events: TimelineEvent[]) => {
    const groups: { title: string; data: TimelineEvent[] }[] = [];
    events.forEach(event => {
      const date = new Date(event.date);
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

      let title: string;
      if (date.toDateString() === today.toDateString()) title = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) title = 'Yesterday';
      else title = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const existing = groups.find(g => g.title === title);
      if (existing) existing.data.push(event);
      else groups.push({ title, data: [event] });
    });
    return groups;
  };

  const sections = groupByDate(filteredEvents);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medical Record</Text>
          <Text style={styles.subtitle}>Complete health timeline</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {(['all', 'diagnosis', 'prescription', 'lab', 'imaging', 'vitals'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Heart size={18} color="#F44336" />
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>Diagnoses</Text>
        </View>
        <View style={styles.summaryCard}>
          <Pill size={18} color="#FF9800" />
          <Text style={styles.summaryValue}>2</Text>
          <Text style={styles.summaryLabel}>Active Rx</Text>
        </View>
        <View style={styles.summaryCard}>
          <FlaskConical size={18} color="#9C27B0" />
          <Text style={styles.summaryValue}>12</Text>
          <Text style={styles.summaryLabel}>Lab Tests</Text>
        </View>
        <View style={styles.summaryCard}>
          <Scan size={18} color="#2196F3" />
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>Imaging</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <View style={styles.sectionHeader}>
              <Calendar size={14} color="#666" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.data.map((event, eventIndex) => {
              const Icon = getEventIcon(event.type);
              const color = getEventColor(event.type);
              const isLast = eventIndex === section.data.length - 1;

              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.timelineItem}
                  onPress={() => router.push({
                    pathname: '/(os)/health/records/detail',
                    params: { id: event.id, type: event.type }
                  } as any)}
                >
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: color }]} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineCard}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.typeIcon, { backgroundColor: color + '15' }]}>
                        <Icon size={16} color={color} />
                      </View>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventTime}>
                          {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#ccc" />
                    </View>
                    <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                    <View style={styles.eventMeta}>
                      <Text style={styles.metaText}>{event.facility}</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>{event.doctor}</Text>
                    </View>
                    {event.status === 'active' && (
                      <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Activity size={12} color="#4CAF50" />
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
  },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#E8E8E8'
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 8, marginBottom: 16
  },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center'
  },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  summaryLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, marginTop: 8, marginBottom: 8
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666' },
  timelineItem: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  timelineLeft: {
    width: 24, alignItems: 'center', marginRight: 8
  },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff'
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#e0e0e0', marginTop: 4
  },
  timelineCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  typeIcon: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  cardHeaderText: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  eventTime: { fontSize: 11, color: '#888', marginTop: 1 },
  eventSubtitle: { fontSize: 12, color: '#555', marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, color: '#888' },
  metaDot: { fontSize: 11, color: '#ccc' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6, marginTop: 8
  },
  statusText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  bottomPadding: { height: 32 }
});
