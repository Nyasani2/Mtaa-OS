// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function AddProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const pickPhoto = () => {
    if (typeof document === 'undefined') { Alert.alert('Photos', 'Camera upload coming on native.'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const path = `${id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { error } = await supabase.storage.from('shop-products').upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from('shop-products').getPublicUrl(path);
        setImages((p) => [...p, data.publicUrl]);
      } catch (e2) { Alert.alert('Upload failed', e2?.message || String(e2)); }
      setUploading(false);
    };
    input.click();
  };

  const submit = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Name is required'); return; }
    if (!price || Number(price) <= 0) { setErr('Price must be > 0'); return; }
    if (!stock || Number(stock) < 0) { setErr('Stock must be >= 0'); return; }
    if (!user?.id) { setErr('Not signed in'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from('products').insert({
        shop_id: id,
        name: name.trim(),
        sku: 'SKU-' + Date.now().toString(36).toUpperCase(),
        cost_price: 0,
        selling_price: Number(price),
        stock_quantity: Number(stock),
        category: category.trim() || null,
        description: description.trim() || null,
        barcode: barcode.trim() || null,
        images,
        is_active: true,
      }).select().single();
      if (error) throw error;
      setName(''); setCategory(''); setBarcode(''); setPrice(''); setStock(''); setDescription(''); setImages([]);
      router.replace(`/shop/${id}/products`);
    } catch (e) { console.error('[add-product]', e); setErr(e?.message || String(e)); }
    setBusy(false);
  };

  const field = { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' };
  const label = { fontWeight: '700', color: '#333', marginBottom: 6 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 14 }}>Add Product</Text>
      {err ? <View style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12, marginBottom: 12 }}><Text style={{ color: '#b71c1c' }}>{err}</Text></View> : null}

      <Text style={label}>Product Photos</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {images.map((u, i) => (
          <View key={i} style={{ position: 'relative' }}>
            <Image source={{ uri: u }} style={{ width: 72, height: 72, borderRadius: 10 }} />
            <TouchableOpacity onPress={() => setImages((p) => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#e53935', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={pickPhoto} style={{ width: 72, height: 72, borderRadius: 10, borderWidth: 1, borderColor: '#bbb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          {uploading ? <ActivityIndicator size="small" /> : <Text style={{ color: '#2196f3', fontWeight: '700' }}>+ Photo</Text>}
        </TouchableOpacity>
      </View>

      <Text style={label}>Product Name *</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Mountain Bike" style={field} />
      <Text style={label}>Category</Text>
      <TextInput value={category} onChangeText={setCategory} placeholder="e.g. Bikes" style={field} />
      <Text style={label}>Barcode / SKU</Text>
      <TextInput value={barcode} onChangeText={setBarcode} placeholder="Optional" style={field} />
      <Text style={label}>Price (KES) *</Text>
      <TextInput value={price} onChangeText={setPrice} placeholder="15000" keyboardType="numeric" style={field} />
      <Text style={label}>Stock Quantity *</Text>
      <TextInput value={stock} onChangeText={setStock} placeholder="50" keyboardType="numeric" style={field} />
      <Text style={label}>Description</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Optional" multiline style={[field, { minHeight: 90 }]} />

      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Add Product</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
