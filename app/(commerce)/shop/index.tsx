// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function MyShopsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setShops(data || []);
    setLoading(false);
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 14 }}>My Shops</Text>
      <TouchableOpacity onPress={() => router.push('/shop/create')} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>+ Create Shop</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.push('/shop/cart')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' }}><Text style={{ fontWeight: '700', color: '#333' }}>Cart</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/shop/orders')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' }}><Text style={{ fontWeight: '700', color: '#333' }}>Orders</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator /> : shops.length === 0 ? (
        <Text style={{ color: '#777', textAlign: 'center', marginTop: 30 }}>No shops yet — create your first one.</Text>
      ) : shops.map((s) => (
        <View key={s.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111' }}>{s.name}</Text>
          <Text style={{ color: '#777', fontSize: 12, marginTop: 2 }}>{s.category} · {s.city || s.address} · {s.status}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <TouchableOpacity onPress={() => router.push(`/shop/${s.id}`)} style={{ backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: '#1976d2', fontWeight: '700' }}>Dashboard</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/shop/${s.id}/products`)} style={{ backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: '#2e7d32', fontWeight: '700' }}>Products</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/shop/${s.id}/sell`)} style={{ backgroundColor: '#fff3e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: '#ef6c00', fontWeight: '700' }}>Sell / POS</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/shop/${s.id}/pay`)} style={{ backgroundColor: '#f3e5f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: '#7b1fa2', fontWeight: '700' }}>Pay ID / QR</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
