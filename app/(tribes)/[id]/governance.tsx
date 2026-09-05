// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { Alert, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as T from '@/lib/tribes/services/tribes.service';
import { Lock, Vote } from 'lucide-react-native';

export default function GovernanceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [count, setCount] = useState(0);
  const [can, setCan] = useState(false);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [c, g, e] = await Promise.all([T.memberCount(id as string), user ? T.canGovern(id as string, user.id) : false, T.getElections(id as string)]);
      setCount(c); setCan(g); setElections(e);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const start = async (type: string) => {
    try {
      await T.createElection(id as string, `Elect ${type}`, type);
      Alert.alert('Election created');
      load();
    } catch (e: any) { Alert.alert('Blocked', e.message); }
  };
  const vote = async (eid: string) => {
    try { await T.castVote(eid); Alert.alert('Vote recorded'); load(); }
    catch (e: any) { Alert.alert('Vote rejected', e.message); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Governance</Text>
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{count} members · governance {can ? 'ENABLED' : `unlocks at 500 members`}</Text>
      {!can && (
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Lock size={18} color="#888" />
          <Text style={{ color: '#888', fontSize: 13 }}>Elections are enforced server-side. At 500 members, members can nominate and elect admins, moderators and elders.</Text>
        </View>
      )}
      {can && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {['admin', 'moderator', 'elder'].map((t) => (
            <TouchableOpacity key={t} onPress={() => start(t)} style={{ backgroundColor: '#e91e63', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Elect {t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {loading ? <ActivityIndicator color="#e91e63" /> : elections.map((e) => (
        <View key={e.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{e.title}</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{e.election_type} · {e.status}</Text>
          {e.status === 'open' && (
            <TouchableOpacity onPress={() => vote(e.id)} style={{ marginTop: 10, backgroundColor: '#2a2a2a', borderRadius: 10, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <Vote size={14} color="#e91e63" /><Text style={{ color: '#e91e63', fontWeight: '600', fontSize: 13 }}>Cast my vote</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
