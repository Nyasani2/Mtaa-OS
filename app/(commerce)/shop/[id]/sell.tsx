// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SellPOSScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const lookup = async (raw) => {
    const q = (raw || code).trim();
    if (!q) return;
    const { data, error } = await supabase.from('products').select('*')
      .eq('shop_id', id).or(`barcode.eq.${q},sku.eq.${q}`).limit(1);
    if (error || !data?.length) { Alert.alert('Not found', `No product with barcode/SKU "${q}"`); return; }
    const p = data[0];
    const inCart = lines.find((l) => l.id === p.id)?.qty || 0;
    if ((p.stock_quantity || 0) - inCart < 1) { Alert.alert('Out of stock', p.name); return; }
    setLines((prev) => {
      const ex = prev.find((l) => l.id === p.id);
      return ex ? prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { id: p.id, name: p.name, price: Number(p.selling_price || 0), qty: 1, stock: p.stock_quantity }];
    });
    setCode(''); ref.current?.focus();
  };

  const complete = async () => {
    if (!lines.length || busy) return;
    setBusy(true);
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    for (const l of lines) {
      const { error } = await supabase.from('products')
        .update({ stock_quantity: Math.max(l.stock - l.qty, 0) }).eq('id', l.id);
      if (error) { Alert.alert('Stock update failed', error.message); setBusy(false); return; }
    }
    const { data: sh } = await supabase.from('shops').select('total_sales,total_orders').eq('id', id).single();
    await supabase.from('shops').update({
      total_sales: Number(sh?.total_sales || 0) + total,
      total_orders: Number(sh?.total_orders || 0) + 1,
    }).eq('id', id);
    if (user?.id) {
      await supabase.rpc('mtaa_credit_wallet', {
        p_user_id: user.id, p_amount: total, p_description: 'POS sale', p_reference: null, p_topup_method: null,
      });
    }
    setLines([]); setBusy(false);
    Alert.alert('Sale complete', `KES ${total.toFixed(2)} — stock updated, wallet credited.`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 12 }}>Sell / POS</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <TextInput ref={ref} value={code} onChangeText={setCode} autoFocus placeholder="Scan or type barcode, press Enter"
          onSubmitEditing={() => lookup(code)} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd' }} />
        <TouchableOpacity onPress={() => lookup(code)} style={{ backgroundColor: '#2196f3', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
        </TouchableOpacity>
      </View>
      {lines.map((l) => (
        <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: '#222' }}>{l.name}</Text>
            <Text style={{ color: '#777', fontSize: 12 }}>KES {l.price.toFixed(2)} · stock {l.stock}</Text>
          </View>
          <TouchableOpacity onPress={() => setLines((p) => p.map((x) => x.id === l.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ paddingHorizontal: 10 }}><Text style={{ fontSize: 18, fontWeight: '800' }}>−</Text></TouchableOpacity>
          <Text style={{ fontWeight: '800', width: 24, textAlign: 'center' }}>{l.qty}</Text>
          <TouchableOpacity onPress={() => setLines((p) => p.map((x) => x.id === l.id ? { ...x, qty: Math.min(l.stock, x.qty + 1) } : x))} style={{ paddingHorizontal: 10 }}><Text style={{ fontSize: 18, fontWeight: '800' }}>+</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setLines((p) => p.filter((x) => x.id !== l.id))} style={{ paddingLeft: 8 }}><Text style={{ color: '#e53935', fontWeight: '700' }}>✕</Text></TouchableOpacity>
        </View>
      ))}
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginVertical: 12 }}>
        Total: KES {lines.reduce((s, l) => s + l.price * l.qty, 0).toFixed(2)}
      </Text>
      <TouchableOpacity onPress={complete} disabled={busy || !lines.length} style={{ backgroundColor: '#43a047', borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: lines.length ? 1 : 0.5 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Complete Sale</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 10, alignItems: 'center' }}><Text style={{ color: '#666' }}>Back to dashboard</Text></TouchableOpacity>
    </ScrollView>
  );
}
