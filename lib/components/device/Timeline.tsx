import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
  speed_kmh?: number;
  metadata?: any;
}

interface TimelineProps {
  events: TimelineEvent[];
  highlightEventId?: string;
}

export default function Timeline({ events, highlightEventId }: TimelineProps) {
  const typeColors: Record<string, string> = {
    recording_start: '#3b82f6', recording_end: '#6b7280',
    event: '#ef4444', emergency: '#dc2626',
    gps: '#22c55e', speed: '#f59e0b',
    incident: '#dc2626', evidence: '#8b5cf6',
    inspection: '#22c55e', maintenance: '#6b7280',
  };

  const typeIcons: Record<string, string> = {
    recording_start: '▶️', recording_end: '⏹️',
    event: '⚠️', emergency: '🆘',
    gps: '📍', speed: '⚡',
    incident: '💥', evidence: '📋',
    inspection: '🔍', maintenance: '🔧',
  };

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isHighlighted = event.id === highlightEventId;
        const color = typeColors[event.type] || '#6b7280';

        return (
          <View key={event.id} style={[styles.row, isHighlighted && styles.highlighted]}>
            <View style={styles.left}>
              <View style={[styles.dot, { backgroundColor: color, borderColor: color }]} />
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.right}>
              <View style={styles.header}>
                <Text style={styles.icon}>{typeIcons[event.type] || '•'}</Text>
                <Text style={styles.time}>{new Date(event.timestamp).toLocaleTimeString()}</Text>
                <View style={[styles.typeBadge, { backgroundColor: color }]}>
                  <Text style={styles.typeText}>{event.type}</Text>
                </View>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              {event.description && <Text style={styles.desc}>{event.description}</Text>}
              {(event.lat || event.speed_kmh) && (
                <View style={styles.meta}>
                  {event.lat && <Text style={styles.metaText}>📍 {event.lat.toFixed(6)}, {event.lng?.toFixed(6)}</Text>}
                  {event.speed_kmh && <Text style={styles.metaText}>⚡ {event.speed_kmh} km/h</Text>}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { flexDirection: 'row', paddingVertical: 8 },
  highlighted: { backgroundColor: '#1e3a5f', borderRadius: 8, marginHorizontal: -8, paddingHorizontal: 8 },
  left: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  line: { width: 2, flex: 1, backgroundColor: '#334155', marginTop: 4 },
  right: { flex: 1, paddingLeft: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  icon: { fontSize: 14, marginRight: 6 },
  time: { fontSize: 11, color: '#64748b', marginRight: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  desc: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaText: { fontSize: 11, color: '#64748b' },
});
