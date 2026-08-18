// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').eq('id', id).maybeSingle();
    setItem(data); setLoading(false);
  })(); }, [id]);

  const addToCart = async () => {
    try {
      const uid = user?.id;
      if (!uid) { setMsg('Sign in first'); return; }
      if (!item?.product_id) { setMsg('Not linked to a product'); return; }
      const { data: prod } = await supabase.from('products').select('shop_id').eq('id', item.product_id).single();
      const shopId = prod?.shop_id;
      if (!shopId) { setMsg('Shop not found'); return; }
      let { data: cart } = await supabase.from('carts').select('id').eq('user_id', uid).eq('shop_id', shopId).maybeSingle();
      if (!cart) cart = (await supabase.from('carts').insert({ user_id: uid, shop_id: shopId, status: 'active' }).select().single()).data;
      if (!cart) { setMsg('Could not open cart'); return; }
      const { error } = await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: item.product_id, qty: 1, unit_price: item.price || 0 });
      if (error) { setMsg(error.message); return; }
      router.push('/marketplace/cart');
    } catch (e) { console.error('[listing-cart]', e); setMsg(String(e?.message || e)); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  if (!item) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Listing not found</Text></View>;
  const img = item.images?.[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fa' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#1976d2', fontWeight: '700', marginBottom: 10 }}>← Back</Text></TouchableOpacity>
      {img ? <Image source={{ uri: img }} style={{ width: '100%', height: 260, borderRadius: 14, marginBottom: 14 }} /> : null}
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>{item.title || item.name}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#1976d2', marginVertical: 6 }}>KES {Number(item.price || 0).toLocaleString()}</Text>
      <Text style={{ color: '#666', marginBottom: 4 }}>{item.condition} · {item.location}</Text>
      <Text style={{ color: '#666', marginBottom: 12 }}>Seller: {item.seller_name || 'MTAA Seller'}</Text>
      <Text style={{ color: '#333', lineHeight: 22, marginBottom: 18 }}>{item.description || 'No description.'}</Text>
      {msg ? <Text style={{ color: '#b71c1c', marginBottom: 8 }}>{msg}</Text> : null}
      <TouchableOpacity onPress={addToCart} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
