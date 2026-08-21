// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

let Bio: any = null;
try { Bio = require('expo-local-authentication'); } catch {}

export async function confirmWithBiometric(reason = 'Confirm payment'): Promise<boolean> {
  try {
    if (!Bio || Platform.OS === 'web') return false;
    const ok = await Bio.hasHardwareAsync();
    if (!ok) return false;
    const r = await Bio.authenticateAsync({ promptMessage: reason });
    return !!r.success;
  } catch { return false; }
}

export function ConfirmPayment({ visible, amount, onClose, onConfirm }: {
  visible: boolean; amount: number; onClose: () => void;
  onConfirm: (auth: { pin?: string; biometric?: boolean }) => void;
}) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const press = async (k: string) => {
    if (k === '⌫') return setPin(p => p.slice(0, -1));
    if (k === '') { const ok = await confirmWithBiometric('Confirm KES ' + amount); if (ok) { setPin(''); onConfirm({ biometric: true }); } else setErr('Biometric failed — use PIN'); return; }
    if (pin.length >= 4) return;
    const np = pin + k; setPin(np);
    if (np.length === 4) { setErr(''); onConfirm({ pin: np }); setPin(''); }
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#0f0f1a', borderRadius: 16, padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Confirm Payment</Text>
          <Text style={{ color: '#2ecc71', fontSize: 26, fontWeight: '800', textAlign: 'center', marginVertical: 6 }}>KES {amount.toLocaleString()}</Text>
          <Text style={{ color: '#8892b0', textAlign: 'center', marginBottom: 10 }}>Enter 4-digit PIN or use biometric</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            {[0,1,2,3].map(i => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: pin.length > i ? '#2ecc71' : '#333' }} />)}
          </View>
          {err ? <Text style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: 6 }}>{err}</Text> : null}
          {['1','2','3','4','5','6','7','8','9','👆','0','⌫'].map(k => (
            <TouchableOpacity key={k} onPress={() => press(k)} style={{ width: '30%', alignSelf: 'center', marginVertical: 4, paddingVertical: 12, borderRadius: 10, backgroundColor: k === '👆' ? '#7c3aed' : '#1a1a2e', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{k}</Text>
            </TouchableOpacity>
          )).reduce((acc: any[], _, i, arr) => { /* render in rows of 3 */ return acc; }, []) as any}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {['1','2','3','4','5','6','7','8','9','👆','0','⌫'].map(k => (
              <TouchableOpacity key={k} onPress={() => press(k)} style={{ width: '28%', paddingVertical: 12, borderRadius: 10, backgroundColor: k === '👆' ? '#7c3aed' : '#1a1a2e', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignItems: 'center' }}><Text style={{ color: '#8892b0' }}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export async function requestPaymentAuth(amount: number): Promise<{pin?:string; biometric?:boolean}|null> {
  const bio = await confirmWithBiometric('Confirm KES ' + amount.toLocaleString());
  if (bio) return { biometric: true };
  const pin = typeof window !== 'undefined' ? window.prompt('Enter your 4-digit transaction PIN to pay KES ' + amount.toLocaleString()) : null;
  if (pin && /^\d{4}$/.test(pin.trim())) return { pin: pin.trim() };
  return null;
}
