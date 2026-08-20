// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SetPin() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [err, setErr] = useState('');
  const press = (k: string) => {
    if (k === '⌫') return step === 'pin' ? setPin(p => p.slice(0,-1)) : setConfirm(p => p.slice(0,-1));
    if (step === 'pin') { const np = pin + k; setPin(np); if (np.length === 4) setStep('confirm'); }
    else { const nc = confirm + k; setConfirm(nc); if (nc.length === 4) save(np_or(nc)); }
  };
  const np_or = (nc: string) => nc;
  const save = async (c: string) => {
    if (c !== pin) { setErr('PINs do not match'); setConfirm(''); setStep('pin'); setPin(''); return; }
    const { error } = await supabase.rpc('hash_tx_pin', { p_pin: pin }).then(async ({ data: hash }) =>
      supabase.from('user_profiles').upsert({ user_id: user!.id, tx_pin_hash: hash }, { onConflict: 'user_id' }));
    if (error) { setErr(error.message); return; }
    window.alert('✅ Transaction PIN set. Every payment will now require it.');
    router.back();
  };
  const cur = step === 'pin' ? pin : confirm;
  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a', padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{step === 'pin' ? 'Set Transaction PIN' : 'Confirm PIN'}</Text>
      <Text style={{ color: '#8892b0', textAlign: 'center', marginBottom: 16 }}>Required for every payment</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
        {[0,1,2,3].map(i => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cur.length > i ? '#2ecc71' : '#333' }} />)}
      </View>
      {err ? <Text style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: 8 }}>{err}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i) => k === '' ? <View key={i} style={{ width: '28%', paddingVertical: 12 }} /> : (
          <TouchableOpacity key={i} onPress={() => press(k)} style={{ width: '28%', paddingVertical: 14, borderRadius: 10, backgroundColor: '#1a1a2e', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{k}</Text>
          </TouchableOpacity>))}
      </View>
    </View>
  );
}
