import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as T from '@/lib/tribes/services/tribes.service';
import AskAsis from '@/lib/tribes/components/AskAsis';

const KINDS = ['article', 'story', 'timeline', 'document', 'faq', 'interview'];

export default function KnowledgeScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('article');

  const load = async () => { try { setEntries(await T.getKnowledge(id as string)); } catch (e) {} };
  useEffect(() => { load(); }, [id]);

  const submit = async () => {
    if (!title.trim() || !user?.id) return;
    try { await T.addKnowledge({ tribe_id: id, kind, title, body, author_id: user.id }); setTitle(''); setBody(''); load(); }
    catch (e: any) { Alert.alert('Failed', e.message); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Knowledge</Text>
        <AskAsis tribeId={id as string} tribeName="this Tribe" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {KINDS.map((k) => (
          <TouchableOpacity key={k} onPress={() => setKind(k)} style={{ borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: kind === k ? '#e91e63' : '#1e1e2e' }}>
            <Text style={{ color: '#fff', fontSize: 11 }}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#666" style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', marginBottom: 8 }} />
      <TextInput value={body} onChangeText={setBody} placeholder="Share knowledge, history, practice..." placeholderTextColor="#666" multiline style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', minHeight: 80, marginBottom: 8 }} />
      <TouchableOpacity onPress={submit} style={{ backgroundColor: '#e91e63', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Contribute</Text>
      </TouchableOpacity>
      {entries.map((e) => (
        <View key={e.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{e.title}</Text>
          {e.body ? <Text style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>{e.body}</Text> : null}
          <Text style={{ color: e.verification === 'verified' ? '#4ade80' : '#fbbf24', fontSize: 11, marginTop: 6 }}>
            {e.verification === 'verified' ? '✓ Verified' : 'Community contribution'} · {e.kind}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
