import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as T from '@/lib/tribes/services/tribes.service';
import { Alert, Mic } from 'lucide-react-native';

export default function EldersScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [topic, setTopic] = useState('');

  const load = async () => {
    try {
      const [m, i] = await Promise.all([T.getMembers(id as string), T.getInterviews(id as string)]);
      setMembers(m.filter((x: any) => x.role === 'elder'));
      setInterviews(i);
    } catch (e) {}
  };
  useEffect(() => { load(); }, [id]);

  const record = async () => {
    if (!topic.trim() || !user?.id) return;
    try { await T.addInterview({ tribe_id: id, speaker_id: user.id, speaker_name: 'Elder', topic, contributor_id: user.id }); setTopic(''); load(); }
    catch (e: any) { Alert.alert('Failed', e.message); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Elders & Oral History</Text>
      <Text style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Elders are cultural & knowledge authorities — recognized by the community, distinct from admins.</Text>
      {members.map((m: any) => (
        <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{(m.user_profiles?.full_name || 'E').charAt(0)}</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{m.user_profiles?.full_name || 'Elder'}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 16 }}>
        <TextInput value={topic} onChangeText={setTopic} placeholder="Record an oral history topic..." placeholderTextColor="#666" style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff' }} />
        <TouchableOpacity onPress={record} style={{ backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}>
          <Mic size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {interviews.map((i) => (
        <View key={i.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{i.speaker_name || 'Elder'} · {i.topic}</Text>
          {i.audio_url ? <Text style={{ color: '#a78bfa', fontSize: 12, marginTop: 4 }}>🎙 audio attached</Text> : null}
          {i.summary ? <Text style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>{i.summary}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}
