// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const TYPES = [
  { id: 'short_stay', label: 'Short Stay' },
  { id: 'long_term', label: 'Long Term' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'hotel', label: 'Hotel' },
];

export default function ListPropertyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [type, setType] = useState('short_stay');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const pickPhotos = () => {
    if (typeof document === 'undefined') { Alert.alert('Photos', 'Photo upload available on web'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []).slice(0, Math.max(0, 6 - photos.length));
      if (!files.length) return;
      setUploading(true);
      for (const f of files) {
        let url = null;
        try {
          const path = 'stay/' + (user?.id || 'anon') + '/' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]+/g, '_');
          const { error } = await supabase.storage.from('stay-photos').upload(path, f, { contentType: f.type, upsert: false });
          if (!error) url = supabase.storage.from('stay-photos').getPublicUrl(path).publicUrl;
        } catch {}
        if (!url) url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => res(null); r.readAsDataURL(f); });
        if (url) setPhotos((p) => [...p, url]);
      }
      setUploading(false);
    };
    input.click();
  };

  const submit = async () => {
    if (!title.trim() || !city.trim() || !price) { Alert.alert('Missing', 'Title, city and price are required'); return; }
    if (!user?.id) { Alert.alert('Auth', 'Sign in first'); return; }
    setBusy(true);
    const payload = {
      owner_id: user.id, owner_type: 'host',
      title: title.trim(), town: city.trim(), country: 'Kenya', full_address: city.trim(),
      property_type: 'apartment', listing_type: type, status: 'active', verification_status: 'unverified',
      price_per_night: Number(price), currency: 'KES',
      bedrooms: 1, bathrooms: 1, furnished: false,
      cover_image: photos[0] || null,
    };
    const { data, error } = await supabase.from('properties').insert(payload).select().single();
    setBusy(false);
    if (error) { setErr(error.message); Alert.alert('❌ Listing failed', error.message); return; }
    if (data?.id && photos.length > 1) {
      for (let i = 1; i < photos.length; i++) {
        await supabase.from('property_photos').insert({ property_id: data.id, url: photos[i], is_primary: false, sort_order: i }).catch(() => {});
      }
    }
    Alert.alert('✅ Listed!', '"' + title + '" is live on Stay.');
    router.replace('/stay/host');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f6f1' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' }}>List Your Stay</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity onPress={pickPhotos} style={{ margin: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#1a5c4b', borderRadius: 14, padding: 20, alignItems: 'center', backgroundColor: '#fff' }}>
        {uploading ? <ActivityIndicator color="#1a5c4b" /> : <Text style={{ color: '#1a5c4b', fontWeight: '700', fontSize: 16 }}>📷 Add Photos (up to 6)</Text>}
      </TouchableOpacity>
      {photos.length > 0 && (
        <ScrollView horizontal style={{ paddingHorizontal: 16, marginBottom: 8 }} showsHorizontalScrollIndicator={false}>
          {photos.map((u, i) => (
            <View key={i} style={{ marginRight: 8, position: 'relative' }}>
              <Image source={{ uri: u }} style={{ width: 84, height: 84, borderRadius: 10 }} />
              <TouchableOpacity onPress={() => setPhotos((p) => p.filter((_, x) => x !== i))} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#c92a2a', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
              {i === 0 && <Text style={{ color: '#1a5c4b', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>Cover</Text>}
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={{ marginHorizontal: 16, fontWeight: '700', marginBottom: 8 }}>Listing Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setType(t.id)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, marginRight: 8, backgroundColor: type === t.id ? '#1a5c4b' : '#fff', borderWidth: 1, borderColor: '#e5e0d5' }}>
            <Text style={{ color: type === t.id ? '#fff' : '#333', fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ marginHorizontal: 16, fontWeight: '700' }}>Title *</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Modern bedsitter" style={{ margin: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 10, padding: 14 }} />

      <Text style={{ marginHorizontal: 16, fontWeight: '700' }}>City *</Text>
      <TextInput value={city} onChangeText={setCity} placeholder="e.g. Nairobi" style={{ margin: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 10, padding: 14 }} />

      <Text style={{ marginHorizontal: 16, fontWeight: '700' }}>Price per Night (KES) *</Text>
      <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 5000" keyboardType="numeric" style={{ margin: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 10, padding: 14 }} />

      {err ? <Text style={{ marginHorizontal: 16, marginBottom: 8, color: '#c92a2a', fontWeight: '700' }}>❌ {err}</Text> : null}
      <TouchableOpacity onPress={submit} disabled={busy} style={{ margin: 16, backgroundColor: '#1a5c4b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{busy ? 'Listing…' : 'List Stay'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
