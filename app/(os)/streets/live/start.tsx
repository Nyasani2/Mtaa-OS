import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function StartLiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [starting, setStarting] = useState(false);

  const handleStartLive = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to go live');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your live session');
      return;
    }

    setStarting(true);
    try {
      const { data, error } = await supabase
        .from('live_rooms')
        .insert({
          host_id: user.id,
          host_name: user.user_metadata?.display_name || 'User',
          title: title.trim(),
          is_live: true,
          is_private: isPrivate,
          ticket_price: parseInt(ticketPrice) || 0,
          gifts_enabled: giftsEnabled,
        })
        .select()
        .single();

      if (error) throw error;

      // Create a content entry for the live
      await supabase.from('street_content').insert({
        user_id: user.id,
        content_type: 'live',
        live_room_id: data.id,
        caption: title.trim(),
        is_live: true,
        status: 'published',
      });

      Alert.alert('Going Live!', 'Your live session is starting...', [
        { text: 'OK', onPress: () => router.push(`/streets/live/${data.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start live');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.livePreview}>
          <Ionicons name="videocam" size={48} color="#ef4444" />
          <Text style={styles.previewText}>Camera Preview</Text>
        </View>

        <Text style={styles.label}>Live Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What's your live about?"
          placeholderTextColor="#475569"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            <Text style={styles.toggleLabel}>Private Room</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#f8fafc"
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="gift-outline" size={20} color="#f59e0b" />
            <Text style={styles.toggleLabel}>Enable Gifts</Text>
          </View>
          <Switch
            value={giftsEnabled}
            onValueChange={setGiftsEnabled}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#f8fafc"
          />
        </View>

        <Text style={styles.label}>Ticket Price (KES, optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="0 for free"
          placeholderTextColor="#475569"
          keyboardType="numeric"
          value={ticketPrice}
          onChangeText={setTicketPrice}
        />

        <TouchableOpacity
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          onPress={handleStartLive}
          disabled={starting}
        >
          <View style={styles.liveDot} />
          <Text style={styles.startBtnText}>
            {starting ? 'Starting...' : 'Start Live Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  content: { padding: 16 },
  livePreview: {
    height: 200,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ef444440',
  },
  previewText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 15, color: '#f8fafc' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  startBtnDisabled: { opacity: 0.6 },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  startBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
