// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as StreetsService from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDur, setVideoDur] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').eq('id', id).maybeSingle();
    setItem(data); setLoading(false);
  })(); }, [id]);

      const pickVideo = () => {
    if (typeof document === 'undefined') { setMsg('Video upload available on web'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      setUploadingVideo(true);
      try {
        const objUrl = URL.createObjectURL(file);
        const dur = await new Promise((res) => { const v = document.createElement('video'); v.preload='metadata'; v.onloadedmetadata=()=>res(v.duration||0); v.onerror=()=>res(0); v.src=objUrl; });
        if (dur > 30.5) { setMsg('Video too long ('+Math.round(dur)+'s). Max 30s.'); setUploadingVideo(false); return; }
        const path = (user?.id||'anon')+'/boost-'+Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9.]+/g,'_');
        const { error } = await supabase.storage.from('streets-media').upload(path, file, { contentType: file.type, upsert: false });
        if (error) { setMsg('Upload failed: '+error.message); setUploadingVideo(false); return; }
        const pub = supabase.storage.from('streets-media').getPublicUrl(path);
        setVideoUrl(pub.publicUrl); setVideoDur(Math.round(dur));
        setMsg('🎬 Video attached ('+Math.round(dur)+'s). Now Boost!');
      } catch (e2) { setMsg('Video error: '+String(e2)); }
      setUploadingVideo(false);
    };
    input.click();
  };

const boostListing = async () => {
    try {
      const { data: wbal } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle();
      const bal = Number(wbal?.balance || 0);
      if (bal < 200) { setMsg('❌ Insufficient wallet balance (KES ' + bal + '). Top up first — boost costs KES 200.'); return; }
      const { error: de } = await supabase.rpc('wallet_debit', { _user_id: user.id, _amount: 200, _reference: 'Boost listing to Streets' });
      if (de) { setMsg('Boost failed: ' + de.message); return; }
      const until = new Date(Date.now() + 7 * 86400000).toISOString();
      const { error: ue } = await supabase.from('marketplace_listings')
        .update({ boosted_until: until, boost_cost: (Number(item.boost_cost) || 0) + 200 })
        .eq('id', item.id);
      if (ue) { setMsg('Boost update failed: ' + ue.message); return; }
      try {
        await StreetsService.createPost({
          creatorId: user.id,
          content: '⚡ Sponsored: ' + (item.title || item.name) + ' — KES ' + Number(item.price || 0).toLocaleString() + ' on MTAA Market!',
          caption: (item.title || item.name) + ' · KES ' + Number(item.price || 0).toLocaleString(),
          mediaUrl: videoUrl || item.video_url || item.images?.[0] || null,
          mediaType: (videoUrl || item.video_url) ? 'video' : 'image',
          hashtags: ['sponsored', 'marketplace', 'mtaa', 'deal'],
          isPublic: true,
          durationSeconds: videoUrl ? videoDur : undefined,
        });
      } catch (postErr) { console.warn('[boost] post failed:', postErr); }
      setMsg('⚡ Boosted! ' + (videoUrl ? 'Video ad' : 'Ad') + ' live on Streets for 7 days.');
      setItem({ ...item, boosted_until: until, boost_cost: (Number(item.boost_cost) || 0) + 200 });
    } catch (e) { setMsg('Boost error: ' + String(e)); }
  };

  const addToCart = async () => {
    try {
      const uid = user?.id;
      if (!uid) { setMsg('Sign in first'); return; }
      if (!item?.product_id) { setMsg('Not linked to a product'); return; }
      const { data: prod } = await supabase.from('products').select('shop_id').eq('id', item.product_id).single();
      const shopId = prod?.shop_id;
      if (!shopId) { setMsg('Shop not found'); return; }
      let { data: cart } = await supabase.from('carts').select('id').eq('user_id', uid).eq('shop_id', shopId).maybeSingle();
      if (!cart) {
        const ins = await supabase.from('carts').insert({ user_id: uid, shop_id: shopId, status: 'active' }).select().single();
        if (ins.error) { setMsg('Cart create: ' + ins.error.message); return; }
        cart = ins.data;
      }
      if (!cart) { setMsg('Could not open cart'); return; }
      const { data: existing } = await supabase.from('cart_items').select('id, qty').eq('cart_id', cart.id).eq('product_id', item.product_id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('cart_items').update({ qty: existing.qty + 1 }).eq('id', existing.id);
        if (error) { setMsg(error.message); return; }
      } else {
        const { error } = await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: item.product_id, qty: 1, unit_price: item.price || 0 });
        if (error) { setMsg(error.message); return; }
      }
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
      {item.seller_id === user?.id ? (
        <TouchableOpacity onPress={pickVideo} disabled={uploadingVideo} style={{ backgroundColor: '#7048e8', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{uploadingVideo ? 'Uploading…' : videoUrl ? '🎬 Video attached (' + videoDur + 's) — tap to replace' : '🎬 Attach 30s Product Video'}</Text>
        </TouchableOpacity>
      ) : null}
      {item.seller_id === user?.id && (!item.boosted_until || new Date(item.boosted_until) < new Date()) ? (
        <TouchableOpacity onPress={boostListing} style={{ backgroundColor: '#f5a623', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>⚡ Boost to Streets (200 KES)</Text>
        </TouchableOpacity>
      ) : null}
      {item.boosted_until && new Date(item.boosted_until) > new Date() ? (
        <View style={{ backgroundColor: '#1a3a1a', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: '#00d26a', fontWeight: '700' }}>✓ Boosted until {new Date(item.boosted_until).toLocaleDateString()}</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={addToCart} style={{ backgroundColor: '#2196f3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
