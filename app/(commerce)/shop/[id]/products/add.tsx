// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

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
        images: [],
        is_active: true,
      }).select().single();

      if (error) throw error;

      Alert.alert('Success', `${name} added!`, [
        { text: 'Add Another', onPress: () => { setName(''); setCategory(''); setBarcode(''); setPrice(''); setStock(''); setDescription(''); } },
        { text: 'Back to Dashboard', onPress: () => router.push(`/shop/${id}`) },
      ]);
    } catch (e) {
      console.error('[add-product]', e);
      setErr(e?.message || String(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 14 }}>Add Product</Text>
      {err ? <View style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12, marginBottom: 12 }}><Text style={{ color: '#b71c1c' }}>{err}</Text></View> : null}

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Product Name *</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Mountain Bike" style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} />

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Category</Text>
      <TextInput value={category} onChangeText={setCategory} placeholder="e.g. Bikes" style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} />

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Barcode / SKU</Text>
      <TextInput value={barcode} onChangeText={setBarcode} placeholder="Optional" style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} />

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Price (KES) *</Text>
      <TextInput value={price} onChangeText={setPrice} placeholder="15000" keyboardType="numeric" style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} />

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Stock Quantity *</Text>
      <TextInput value={stock} onChangeText={setStock} placeholder="50" keyboardType="numeric" style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' }} />

      <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>Description</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Optional" multiline style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 18, minHeight: 90, borderWidth: 1, borderColor: '#ddd' }} />

      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Add Product</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
