// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AffiliateScreen() {
  const router = useRouter();
  const [aff, setAff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) { setLoading(false); return; }
      const { data } = await supabase.from('affiliates').select('*').eq('user_id', uid).maybeSingle();
      setAff(data);
    } catch (e) { console.error('[affiliate] load', e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const join = async () => {
    setErr(null);
    setJoining(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) { setErr('Sign in first'); setJoining(false); return; }
      const code = 'MTAA-' + uid.slice(0, 8).toUpperCase() + '-' + Date.now().toString(36).slice(-4).toUpperCase();
      const { data, error } = await supabase.from('affiliates').insert({ user_id: uid, referral_code: code, status: 'active', tier: 'standard', commission_rate: 0.05 }).select().single();
      if (error) { setErr(error.message); setJoining(false); return; }
      setAff(data);
    } catch (e: any) { setErr(e?.message || String(e)); }
    setJoining(false);
  };

  const shareCode = async () => {
    if (!aff?.referral_code) return;
    try { await Share.share({ message: `Join MTAA with my referral code: ${aff.referral_code}\nhttps://mtaa.app?ref=${aff.referral_code}` }); } catch {}
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0f' }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#007AFF', fontWeight: '700', marginBottom: 12 }}>← Back</Text></TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 14 }}>Affiliate Program</Text>

      {aff ? (
        <>
          <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <Text style={{ color: '#00d26a', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>✓ Active Member</Text>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Your Referral Code</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12, fontFamily: 'monospace' }}>{aff.referral_code}</Text>
            <TouchableOpacity onPress={shareCode} style={{ backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Share Code</Text>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Your Stats</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <Text style={{ color: '#888' }}>Tier</Text><Text style={{ color: '#fff', fontWeight: '600' }}>{aff.tier}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <Text style={{ color: '#888' }}>Commission Rate</Text><Text style={{ color: '#f5a623', fontWeight: '700' }}>{(Number(aff.commission_rate || 0) * 100).toFixed(1)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <Text style={{ color: '#888' }}>Total Earnings</Text><Text style={{ color: '#00d26a', fontWeight: '700' }}>KES {Number(aff.total_earnings || 0).toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <Text style={{ color: '#888' }}>Total Referrals</Text><Text style={{ color: '#fff', fontWeight: '600' }}>{aff.total_referrals || 0}</Text>
            </View>
          </View>

          <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>How It Works</Text>
            <Text style={{ color: '#ccc', lineHeight: 22 }}>
              1. Share your referral code with friends{'\n'}
              2. They sign up and make purchases{'\n'}
              3. You earn {(Number(aff.commission_rate || 0) * 100).toFixed(0)}% of their qualifying orders{'\n'}
              4. Earnings appear in your wallet automatically
            </Text>
          </View>
        </>
      ) : (
        <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎯</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Earn with MTAA</Text>
          <Text style={{ color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 18 }}>
            Refer friends to MTAA and earn 5% commission on every qualifying purchase they make. Payments go directly to your wallet.
          </Text>
          {err ? <Text style={{ color: '#b71c1c', marginBottom: 8 }}>{err}</Text> : null}
          <TouchableOpacity onPress={join} disabled={joining} style={{ backgroundColor: '#00d26a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' }}>
            {joining ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Join Affiliate Program</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
