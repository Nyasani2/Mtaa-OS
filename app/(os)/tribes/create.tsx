// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import tribesService from '@/lib/tribes/services/tribes.service';

const CATEGORIES = ['cultural', 'interest', 'professional', 'knowledge', 'civic', 'brand', 'sports', 'technology', 'agricultural', 'automotive', 'education', 'creative'];

export default function CreateTribeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('interest');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (!user?.id) { Alert.alert('Log in first'); return; }
    setBusy(true);
    try {
      const tribe = await tribesService.createTribe({
        name: name.trim(), description, category, country: country || null, language: language || null,
        visibility, membership_type: paid ? 'paid' : 'free', creator_id: user.id,
      });
      router.replace(`/tribes/${tribe.id}`);
    } catch (e) { console.error('[CreateTribe]', e); setErr(e?.message || String(e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Create Tribe</Text>
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Cultural, interest, professional, civic, brand — any community.</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Tribe name" placeholderTextColor="#666" style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#fff', marginBottom: 10 }} />
      <TextInput value={description} onChangeText={setDescription} placeholder="What is this community about?" placeholderTextColor="#666" multiline style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#fff', minHeight: 90, marginBottom: 10 }} />
      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: category === c ? '#2196f3' : '#1e1e2e' }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput value={country} onChangeText={setCountry} placeholder="Country (optional)" placeholderTextColor="#666" style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#fff', marginBottom: 10 }} />
      <TextInput value={language} onChangeText={setLanguage} placeholder="Language (optional)" placeholderTextColor="#666" style={{ backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: '#fff', marginBottom: 10 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: '#fff', fontSize: 14 }}>Private tribe</Text>
        <Switch value={visibility === 'private'} onValueChange={(v) => setVisibility(v ? 'private' : 'public')} trackColor={{ true: '#2196f3' }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 14 }}>Paid membership</Text>
        <Switch value={paid} onValueChange={setPaid} trackColor={{ true: '#2196f3' }} />
      </View>
      {err && <View style={{ backgroundColor: '#3a1a1a', borderRadius: 8, padding: 10, marginBottom: 10 }}><Text style={{ color: '#ff6b6b', fontSize: 13 }}>{err}</Text></View>}
      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create Tribe</Text>}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
