// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AskAsis({ tribeId, tribeName, context, onInsert }: { tribeId: string; tribeName: string; context?: string; onInsert?: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<any[] | null>(null);

  const ask = async () => {
    if (!q.trim()) return;
    setBusy(true); setAnswer(null);
    try {
      // Grounded retrieval over Tribe knowledge — ASIS cites, never invents
      const { data } = await supabase
        .from('tribe_knowledge_entries')
        .select('title, summary, body, verification, references_json, kind')
        .eq('tribe_id', tribeId)
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%,body.ilike.%${q}%`)
        .limit(4);
      setAnswer(data || []);
    } catch (e) { setAnswer([]); }
    setBusy(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a2e', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#7c3aed' }}>
        <Sparkles size={14} color="#a78bfa" /><Text style={{ color: '#a78bfa', fontSize: 12, fontWeight: '600' }}>Ask ASIS</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#a78bfa', fontWeight: '700' }}>ASIS · {tribeName}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            {context && <Text style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>Context: {context}</Text>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={q} onChangeText={setQ} placeholder={`Ask about ${tribeName}...`} placeholderTextColor="#666" style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#fff' }} />
              <TouchableOpacity onPress={ask} style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Ask</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 12 }}>
              {answer && answer.length === 0 && (
                <Text style={{ color: '#888', fontSize: 13 }}>No verified Tribe knowledge matches yet. ASIS only answers from Tribe-contributed, source-tagged material — it will not invent history.</Text>
              )}
              {answer?.map((a, i) => (
                <View key={i} style={{ backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{a.title}</Text>
                  {a.summary ? <Text style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>{a.summary}</Text> : null}
                  <Text style={{ color: a.verification === 'verified' ? '#4ade80' : '#fbbf24', fontSize: 11, marginTop: 6 }}>
                    {a.verification === 'verified' ? '✓ Verified' : a.verification === 'community' ? 'Community contribution' : 'Uncertain'} · {a.kind}
                  </Text>
                  {onInsert ? (
                    <TouchableOpacity onPress={() => { onInsert(((a.title || '') + '. ' + (a.summary || a.body || '')).trim()); setOpen(false); }} style={{ marginTop: 8, backgroundColor: '#2a2a3e', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ color: '#a78bfa', fontSize: 12, fontWeight: '700' }}>Use in post</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
