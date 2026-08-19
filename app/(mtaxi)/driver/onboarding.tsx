// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const FEES: Record<string, number> = { boda: 1000, car: 2000, truck: 5000 };
const ANGLES = ['Front', 'Back', 'Left side', 'Right side', 'Interior'];
const CONDITION = ['Bodywork', 'Tyres', 'Lights', 'Brakes', 'Engine', 'Cleanliness'];
const dark = { backgroundColor: '#0f0f1a' };
const inp = { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, marginBottom: 10, color: '#fff' };
const lbl = { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 };

export default function DriverOnboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { garageId } = useLocalSearchParams<{ garageId?: string }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [vType, setVType] = useState('boda');
  const [f, setF] = useState({ full_name: '', phone: '', vehicle_plate: '', vehicle_color: '', vehicle_year: '', license_number: '', license_expiry: '' });
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [cond, setCond] = useState<Record<string, boolean>>({});
  const [docs, setDocs] = useState<{ insurance?: string; conduct?: string }>({});
  const set = (k: string) => (t: string) => setF(p => ({ ...p, [k]: t }));
  const fee = FEES[vType];

  const pick = (key: string, into: 'photo' | 'doc') => {
    if (typeof document === 'undefined') return;
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = (e: any) => { const file = e.target.files?.[0]; if (!file) return;
      const r = new FileReader(); r.onload = () => { const d = String(r.result);
        if (into === 'photo') setPhotos(p => ({ ...p, [key]: d })); else setDocs(p => ({ ...p, [key as any]: d })); }; r.readAsDataURL(file); };
    i.click();
  };

  const submit = async () => {
    setErr('');
    if (!f.full_name || !f.phone || !f.vehicle_plate || !f.license_number) { setErr('Name, phone, plate and licence are required.'); return; }
    if (Object.keys(photos).length < 5) { setErr('All 5 vehicle photos are required (front/back/left/right/interior).'); return; }
    if (CONDITION.some(c => !cond[c])) { setErr('Tick every condition item — vehicle condition is mandatory.'); return; }
    if (!docs.insurance || !docs.conduct) { setErr('Insurance doc + Certificate of Good Conduct are required.'); return; }
    setBusy(true);
    try {
      // 1) wallet balance gate
      const { data: w } = await supabase.from('wallet_accounts').select('balance, available_balance').eq('user_id', user!.id).maybeSingle();
      const bal = Number(w?.available_balance ?? w?.balance ?? 0);
      if (bal < fee) { setErr('❌ Insufficient balance (KES ' + bal + '). Top up KES ' + fee + ' to activate.'); setBusy(false); return; }
      // 2) atomic debit (platform 50% + garage/inspector 50%)
      const payee = garageId ? (await supabase.from('mtaxi_garages').select('owner_id').eq('id', garageId).maybeSingle()).data?.owner_id : user!.id;
      const { error: se } = await supabase.rpc('mtaa_settle', { p_payer_id: user!.id, p_payee_id: payee || user!.id, p_total: fee, p_platform_rate_pct: 50, p_wht_rate_pct: 0, p_reference: 'driver-onboard-' + Date.now() });
      if (se) throw new Error(se.message);
      // 3) create driver record
      const { error: e1 } = await supabase.from('mtaxi_drivers').upsert({
        user_id: user!.id, ...f, vehicle_type: vType, garage_id: garageId || null,
        photos: ANGLES.map(a => photos[a]).filter(Boolean),
        condition_checklist: cond, insurance_doc_url: docs.insurance, good_conduct_url: docs.conduct,
        onboarding_fee_paid: true, is_active: true,
      }, { onConflict: 'user_id' });
      if (e1) throw new Error(e1.message);
      // 4) link to garage
      if (garageId) {
        const { data: d } = await supabase.from('mtaxi_drivers').select('id').eq('user_id', user!.id).maybeSingle();
        if (d?.id) await supabase.from('garage_drivers').upsert({ garage_id: garageId, driver_id: d.id, role: 'mechanic', status: 'active' }, { onConflict: 'garage_id,driver_id' });
      }
      window.alert('✅ Activated! KES ' + fee + ' paid. You are now a ' + vType.toUpperCase() + ' driver.');
      router.back();
    } catch (e) { setErr('❌ ' + String((e as any)?.message || e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, ...dark, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>🚗 Become a Driver</Text>
      <Text style={{ color: '#8892b0', marginBottom: 8 }}>{garageId ? 'Activate under your garage' : 'Activate to take rides & inspections'} · Fee KES {fee.toLocaleString()} (debited from wallet)</Text>

      <Text style={lbl}>Vehicle type (sets fee)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        {(['boda', 'car', 'truck'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setVType(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: vType === t ? '#e94560' : '#1a1a2e' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t.toUpperCase()} · KES {FEES[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={lbl}>Full name *</Text><TextInput style={inp} value={f.full_name} onChangeText={set('full_name')} placeholderTextColor="#555" />
      <Text style={lbl}>Phone *</Text><TextInput style={inp} value={f.phone} onChangeText={set('phone')} placeholderTextColor="#555" keyboardType="phone-pad" />
      <Text style={lbl}>License plate *</Text><TextInput style={inp} value={f.vehicle_plate} onChangeText={set('vehicle_plate')} placeholderTextColor="#555" />
      <Text style={lbl}>Vehicle colour</Text><TextInput style={inp} value={f.vehicle_color} onChangeText={set('vehicle_color')} placeholderTextColor="#555" />
      <Text style={lbl}>Vehicle year (≤20 yrs old)</Text><TextInput style={inp} value={f.vehicle_year} onChangeText={set('vehicle_year')} placeholderTextColor="#555" keyboardType="numeric" />
      <Text style={lbl}>Driving licence no. *</Text><TextInput style={inp} value={f.license_number} onChangeText={set('license_number')} placeholderTextColor="#555" />
      <Text style={lbl}>Licence expiry (YYYY-MM-DD)</Text><TextInput style={inp} value={f.license_expiry} onChangeText={set('license_expiry')} placeholderTextColor="#555" />

      <Text style={{ ...lbl, fontSize: 14, color: '#fff' }}>📷 Vehicle photos — all 5 required *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ANGLES.map(a => (
          <TouchableOpacity key={a} onPress={() => pick(a, 'photo')} style={{ width: '48%', backgroundColor: '#1a1a2e', borderRadius: 10, overflow: 'hidden' }}>
            {photos[a] ? <Image source={{ uri: photos[a] }} style={{ width: '100%', height: 90 }} /> : <View style={{ height: 90, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#555' }}>+ {a}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ ...lbl, fontSize: 14, color: '#fff' }}>✅ Vehicle condition — tick all *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CONDITION.map(c => (
          <TouchableOpacity key={c} onPress={() => setCond(p => ({ ...p, [c]: !p[c] }))} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: cond[c] ? '#2ecc71' : '#1a1a2e' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{cond[c] ? '✓ ' : ''}{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ ...lbl, fontSize: 14, color: '#fff' }}>📄 Documents — both required *</Text>
      <TouchableOpacity onPress={() => pick('insurance', 'doc')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: docs.insurance ? '#2ecc71' : '#8892b0' }}>{docs.insurance ? '✓ Insurance uploaded' : '+ Insurance document'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => pick('conduct', 'doc')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: docs.conduct ? '#2ecc71' : '#8892b0' }}>{docs.conduct ? '✓ Good Conduct uploaded' : '+ Certificate of Good Conduct'}</Text></TouchableOpacity>

      {err ? <Text style={{ color: '#ff6b6b', fontWeight: '700', marginVertical: 8 }}>{err}</Text> : null}
      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2ecc71', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6, opacity: busy ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{busy ? 'Activating…' : 'Pay KES ' + fee.toLocaleString() + ' & Activate'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
