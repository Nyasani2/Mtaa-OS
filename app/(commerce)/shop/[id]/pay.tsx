import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';


export default function ShopPayIdScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [row, setRow] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => { (async () => {
    if (!user?.id) { setChecking(false); return; }
    const { data: staff } = await supabase.from('shop_staff').select('role_name').eq('shop_id', id).eq('user_id', user.id).limit(1);
    const owner = staff?.[0]?.role_name === 'owner';
    setIsOwner(owner);
    if (owner) {
      let { data } = await supabase.from('shop_wallets').select('*').eq('shop_id', id).maybeSingle();
      if (!data) {
        const wid = 'WAL-' + String(id).replace(/-/g, '').slice(0, 10).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        const ins = await supabase.from('shop_wallets').insert({ shop_id: id, user_id: user.id, wallet_id: wid }).select().single();
        data = ins.data;
      }
      setRow(data);
    }
    setChecking(false);
  })(); }, [id, user?.id]);

  if (checking) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7fa' }}><ActivityIndicator /></View>;
  if (!isOwner) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7fa' }}><Text style={{ color: '#b71c1c', fontWeight: '800' }}>Owner access only.</Text></View>;

  const payLink = 'mtaa://pay/' + (row?.wallet_id || '');
  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fa', padding: 20, paddingTop: 56 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#1976d2', fontWeight: '700', marginBottom: 12 }}>← Back</Text></TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>Shop Pay ID</Text>
      <Text style={{ color: '#666', marginTop: 4, marginBottom: 18 }}>Private to you. Customers scan to pay this shop.</Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eee' }}>
        <View style={{width:200,height:200,backgroundColor:"#111",justifyContent:"center",alignItems:"center",borderRadius:12}}><Text style={{color:"#fff",fontSize:11,textAlign:"center"}}>QR renders on native{"\n"}(install react-native-qrcode-svg to enable)</Text></View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginTop: 12 }}>{row?.wallet_id}</Text>
        <TouchableOpacity onPress={() => { try { (navigator as any)?.clipboard?.writeText(payLink); Alert.alert('Copied', payLink); } catch {} }} style={{ marginTop: 12, backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#1976d2', fontWeight: '700' }}>Copy pay link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
