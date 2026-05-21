import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { TribeEvent } from '../types';

interface Props {
  event: TribeEvent;
  onPress: () => void;
}

export const TribeEventCard: React.FC<Props> = ({ event, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {event.cover_url && <Image source={{ uri: event.cover_url }} style={styles.cover} />}
    <View style={styles.content}>
      <Text style={styles.type}>{event.event_type.toUpperCase()}</Text>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>📍 {event.location || 'Virtual'} • {new Date(event.start_time).toLocaleDateString()}</Text>
      <Text style={styles.attendees}>{event.attendee_count} going</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a3e', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cover: { width: '100%', height: 120 },
  content: { padding: 16 },
  type: { color: '#e94560', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#a0a0a0', fontSize: 13, marginTop: 6 },
  attendees: { color: '#4ade80', fontSize: 13, marginTop: 4 }
});
