// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SetPinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cur = step === 'pin' ? pin : confirm;

  const press = async (k: string) => {
    if (busy) return;
    if (k === '⌫') return step === 'pin' ? setPin(p => p.slice(0, -1)) : setConfirm(p => p.slice(0, -1));
    if (cur.length >= 4) return;
    if (step === 'pin') {
      const np = pin + k; setPin(np);
      if (np.length === 4) { setStep('confirm'); setErr(''); }
    } else {
      const nc = confirm + k; setConfirm(nc);
      if (nc.length === 4) await save(nc);
    }
  };

  const save = async (c: string) => {
    if (c !== pin) { setErr('PINs do not match'); setConfirm(''); setStep('pin'); setPin(''); return; }
    if (!user?.id) { setErr('Not logged in'); return; }
    setBusy(true); setErr('');
    try {
      // 1) ensure profile has a display_name (NOT NULL) before any upsert
      const email = (user as any)?.email || 'user';
      const name = email.split('@')[0];
      await supabase.from('user_profiles').update({ display_name: name }).eq('user_id', user.id);
      await supabase.from('user_profiles').upsert(
        { user_id: user.id, display_name: name },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
      // 2) store hashed PIN
      const { data: hash, error: he } = await supabase.rpc('hash_tx_pin', { p_pin: pin });
      if (he) throw new Error(he.message);
      const { error: ue } = await supabase.from('user_profiles')
        .update({ tx_pin_hash: hash, pin_set: true }).eq('user_id', user.id);
      if (ue) throw new Error(ue.message);
      window.alert('✅ Transaction PIN set. Every payment will now require it.');
      router.back();
    } catch (e) {
      setErr(String((e as any)?.message || e));
    } finally { setBusy(false); }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{step === 'pin' ? 'Set Transaction PIN' : 'Confirm PIN'}</Text>
      <Text style={s.sub}>Required for every payment</Text>
      <View style={s.dots}>
        {[0,1,2,3].map(i => <View key={i} style={[s.dot, cur.length > i && s.dotOn]} />)}
      </View>
      {err ? <Text style={s.err}>{err}</Text> : null}
      <View style={s.pad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) =>
          k === '' ? <View key={i} style={s.key} /> : (
            <TouchableOpacity key={i} onPress={() => press(k)} style={s.key}>
              <Text style={s.keyT}>{k}</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#8892b0', marginTop: 4, marginBottom: 16 },
  dots: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#333' },
  dotOn: { backgroundColor: '#2ecc71' },
  err: { color: '#ff6b6b', marginBottom: 12, textAlign: 'center' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 10 },
  key: { width: 80, height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10 },
  keyT: { color: '#fff', fontSize: 22, fontWeight: '700' },
});
