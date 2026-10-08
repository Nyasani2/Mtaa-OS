// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const TYPES = [
  ['retail', 'Retail Store'],
  ['restaurant', 'Restaurant'],
  ['pharmacy', 'Pharmacy'],
  ['electronics', 'Electronics'],
  ['hardware', 'Hardware'],
  ['supermarket', 'Supermarket'],
  ['service', 'Service Provider'],
  ['manufacturer', 'Manufacturer'],
  ['distributor', 'Distributor'],
  ['other', 'Other'],
];

export default function CreateShopScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('retail');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    if (!name.trim()) {
      setErr('Business name is required');
      return;
    }
    if (!user?.id) {
      setErr('Not signed in — log in first');
      return;
    }
    setBusy(true);
    try {
      // Use Edge Function for shop creation
      const { data, error } = await supabase.functions.invoke('create-shop', {
        body: {
          name: name.trim(),
          category: type,
          address: location.trim() || null,
          city: location.trim() || null,
          
          owner_id: user.id,
          is_active: true,
          is_verified: false,
        }
      });

      if (error) throw error;
      
      if (data?.shop) {
        router.replace(`/(commerce)/shop/${data.shop.id}`);
      } else {
        throw new Error('Shop created but no data returned');
      }
    } catch (e) {
      console.error('[shop-create]', e);
      setErr(e?.message || String(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 16 }}>Create Your Business</Text>
      {err ? <View style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12, marginBottom: 12 }}><Text style={{ color: '#b71c1c' }}>{err}</Text></View> : null}
      
      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Business Name *</Text>
      <TextInput 
        value={name} 
        onChangeText={setName} 
        placeholder="Enter business name" 
        style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} 
      />
      
      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Business Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TYPES.map(([k, label]) => (
          <TouchableOpacity 
            key={k} 
            onPress={() => setType(k)} 
            style={{ 
              paddingHorizontal: 14, 
              paddingVertical: 10, 
              borderRadius: 10, 
              borderWidth: 1, 
              borderColor: type === k ? '#2196f3' : '#ddd', 
              backgroundColor: type === k ? '#e3f2fd' : '#fff' 
            }}
          >
            <Text style={{ color: type === k ? '#1976d2' : '#555', fontWeight: '600' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Address / Location</Text>
      <TextInput 
        value={location} 
        onChangeText={setLocation} 
        placeholder="e.g. Kitengela, Nairobi" 
        style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} 
      />
      
      <TextInput 
        value={description} 
        multiline 
        style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 18, minHeight: 90, borderWidth: 1, borderColor: '#ddd' }} 
      />
      
      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Create Business</Text>}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
