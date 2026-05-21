import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribeService } from '@/lib/tribes/services/tribeService';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    const { data, error } = await supabase.from('tribe_events').select('*, creator:profiles(full_name, avatar_url)').eq('id', id).single();
    if (error) { Alert.alert('Error', error.message); }
    else { setEvent(data); }
    setLoading(false);
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    await tribeService.rsvpEvent(id as string, status);
    Alert.alert('RSVP Updated', `You are ${status}`);
    loadEvent();
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading event...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {event.cover_url && <Image source={{ uri: event.cover_url }} style={styles.cover} />}
        <View style={styles.content}>
          <Text style={styles.type}>{event.event_type.toUpperCase()}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>📍 {event.location || 'Virtual'} • {new Date(event.start_time).toLocaleString()}</Text>
          <Text style={styles.description}>{event.description}</Text>

          <Text style={styles.sectionTitle}>RSVP</Text>
          <View style={styles.rsvpRow}>
            <TouchableOpacity style={[styles.rsvpBtn, styles.goingBtn]} onPress={() => handleRSVP('going')}>
              <Text style={styles.rsvpText}>✓ Going</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rsvpBtn, styles.maybeBtn]} onPress={() => handleRSVP('maybe')}>
              <Text style={styles.rsvpText}>? Maybe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rsvpBtn, styles.noBtn]} onPress={() => handleRSVP('not_going')}>
              <Text style={styles.rsvpText}>✕ Not Going</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{event.attendee_count} people going</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 50 },
  cover: { width: '100%', height: 200 },
  content: { padding: 20 },
  type: { color: '#e94560', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  meta: { color: '#a0a0a0', fontSize: 14, marginTop: 8 },
  description: { color: '#ccc', fontSize: 15, lineHeight: 22, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  rsvpRow: { flexDirection: 'row', gap: 12 },
  rsvpBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  goingBtn: { backgroundColor: '#1a5f2a' },
  maybeBtn: { backgroundColor: '#854d0e' },
  noBtn: { backgroundColor: '#7f1d1d' },
  rsvpText: { color: '#fff', fontWeight: 'bold' }
});
