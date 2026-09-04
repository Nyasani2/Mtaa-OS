// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const FEES = { boda: 1000, car: 2000, truck: 5000 };
const card = { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 };
const inp = { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginBottom: 8 };

export default function InspectionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('vehicle');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  // vehicle inspection
  const [vType, setVType] = useState('boda');
  const [make, setMake] = useState(''); const [model, setModel] = useState('');
  const [year, setYear] = useState(''); const [plate, setPlate] = useState(''); const [vin, setVin] = useState('');
  const [dName, setDName] = useState(''); const [lic, setLic] = useState(''); const [nid, setNid] = useState('');
  const [insurer, setInsurer] = useState(''); const [policy, setPolicy] = useState(''); const [insExp, setInsExp] = useState('');
  const [docs, setDocs] = useState({});
  // inspector / garage
  const [iName, setIName] = useState(''); const [iNid, setINid] = useState(''); const [iGC, setIGC] = useState(null);

  const fee = FEES[vType];
  const pick = (key, label) => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,.pdf';
    input.onchange = (e) => { const f = e.target.files?.[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => setDocs(d => ({ ...d, [key]: String(r.result) })); r.readAsDataURL(f); };
    input.click();
  };

  const pay = async (amount, ref) => {
    const { data: w } = await supabase.from('wallet_accounts').select('balance, available_balance').eq('user_id', user.id).maybeSingle();
    const bal = Number(w?.available_balance ?? w?.balance ?? 0);
    if (bal < amount) throw new Error('Insufficient wallet balance (KES ' + bal + '). Top up first.');
    const { error } = await supabase.rpc('wallet_debit', { _user_id: user.id, _amount: amount, _reference: ref });
    if (error) throw new Error(error.message);
    return bal;
  };

  const submitVehicle = async () => {
    setErr(null); setBusy(true);
    try {
      const y = Number(year); const maxAge = new Date().getFullYear() - 20;
      if (!y || y < maxAge) throw new Error('❌ Vehicles older than 20 years (before ' + maxAge + ') are not allowed.');
      if (!make || !plate || !dName || !lic || !insurer || !policy) throw new Error('Vehicle, driver and insurance info are all required.');
      if (!docs.insurance || !docs.goodconduct) throw new Error('Upload insurance document + Certificate of Good Conduct.');
      if (!docs.photo1) throw new Error('Add at least one vehicle photo.');
      await pay(fee, 'Vehicle inspection ' + vType + ' ' + plate);
      const { error } = await supabase.from('mtaxi_vehicle_inspections').insert({
        vehicle_type: vType, vehicle_year: y, vin, plate,
        driver_name: dName, license_no: lic, national_id: nid,
        insurer, policy_no: policy, insurance_expiry: insExp,
        insurance_doc_url: docs.insurance, good_conduct_url: docs.goodconduct,
        photos: [docs.photo1, docs.photo2, docs.photo3, docs.photo4].filter(Boolean),
        fee, platform_share: fee / 2, inspector_share: fee / 2,
        payment_status: 'paid', status: 'pending_assignment', owner_id: user.id,
      });
      if (error) throw new Error(error.message);
      Alert.alert('✅ Inspection submitted', 'Fee KES ' + fee + ' paid.\nPlatform KES ' + fee / 2 + ' · Inspector KES ' + fee / 2 + ' (released on completion).\nMTAA will assign a certified inspector.');
    } catch (e) { setErr(String(e?.message || e)); }
    setBusy(false);
  };

  const submitInspector = async () => {
    setErr(null); setBusy(true);
    try {
      if (!iName || !iNid || !iGC) throw new Error('Name, National ID and Good Conduct upload required.');
      await pay(5000, 'Inspector onboarding fee');
      const { error } = await supabase.from('mtaxi_inspectors').insert({ user_id: user.id, name: iName, national_id: iNid, good_conduct_url: iGC, paid: true, status: 'active' });
      if (error) throw new Error(error.message);
      Alert.alert('✅ You are now a certified MTAA inspector', 'KES 5,000 paid. You earn 50% of every inspection you complete.');
    } catch (e) { setErr(String(e?.message || e)); }
    setBusy(false);
  };

  const submitGarage = async () => {
    setErr(null); setBusy(true);
    try {
      await pay(5000, 'Garage inspection partner fee');
      const { error } = await supabase.from('mtaxi_garages').update({ inspection_partner: true, partner_fee_paid_at: new Date().toISOString() }).eq('owner_id', user.id);
      if (error) throw new Error(error.message);
      Alert.alert('✅ Garage unlocked for inspection earnings', 'Free tools stay free. You now earn 50% on inspections you perform.');
    } catch (e) { setErr(String(e?.message || e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f4f5f7' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#0284c7', fontWeight: '700', marginBottom: 10 }}>← Back</Text></TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 4 }}>🔍 Vehicle Inspections</Text>
      <Text style={{ color: '#666', marginBottom: 12 }}>Boda KES 1,000 · Taxi KES 2,000 · Truck KES 5,000 — split 50/50 platform & inspector</Text>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {[['vehicle', 'Inspect Vehicle'], ['inspector', 'Become Inspector'], ['garage', 'Garage Partner']].map(([k, l]) => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, marginRight: 6, backgroundColor: tab === k ? '#0284c7' : '#ddd', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'vehicle' && (
        <View>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            {Object.keys(FEES).map(t => (
              <TouchableOpacity key={t} onPress={() => setVType(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, marginRight: 6, backgroundColor: vType === t ? '#16a34a' : '#e5e5e5', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: vType === t ? '#fff' : '#333' }}>{t.toUpperCase()} KES {FEES[t].toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Vehicle Info</Text>
            <TextInput style={inp} placeholder="Make (e.g. Toyota)" value={make} onChangeText={setMake} />
            <TextInput style={inp} placeholder="Model" value={model} onChangeText={setModel} />
            <TextInput style={inp} placeholder="Year (2006 or newer)" keyboardType="numeric" value={year} onChangeText={setYear} />
            <TextInput style={inp} placeholder="License Plate" value={plate} onChangeText={setPlate} />
            <TextInput style={inp} placeholder="VIN (optional)" value={vin} onChangeText={setVin} />
          </View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Driver Info</Text>
            <TextInput style={inp} placeholder="Full name" value={dName} onChangeText={setDName} />
            <TextInput style={inp} placeholder="Driving licence no." value={lic} onChangeText={setLic} />
            <TextInput style={inp} placeholder="National ID" value={nid} onChangeText={setNid} />
          </View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Insurance Info</Text>
            <TextInput style={inp} placeholder="Insurer" value={insurer} onChangeText={setInsurer} />
            <TextInput style={inp} placeholder="Policy no." value={policy} onChangeText={setPolicy} />
            <TextInput style={inp} placeholder="Expiry (YYYY-MM-DD)" value={insExp} onChangeText={setInsExp} />
          </View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Uploads (benchmark: Uber/Bolt/Little Cab)</Text>
            <TouchableOpacity onPress={() => pick('insurance')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: docs.insurance ? '#16a34a' : '#0284c7' }}>{docs.insurance ? '✅ Insurance doc uploaded' : '📄 Insurance document *'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pick('goodconduct')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: docs.goodconduct ? '#16a34a' : '#0284c7' }}>{docs.goodconduct ? '✅ Good Conduct uploaded' : '📄 Certificate of Good Conduct *'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pick('photo1')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: docs.photo1 ? '#16a34a' : '#0284c7' }}>{docs.photo1 ? '✅ Photo 1 added' : '📷 Vehicle photo (front) *'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pick('photo2')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: '#0284c7' }}>📷 Photo 2 (side) optional</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pick('photo3')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: '#0284c7' }}>📷 Photo 3 (rear) optional</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pick('photo4')} style={[inp, { alignItems: 'center' }]}><Text style={{ color: '#0284c7' }}>📷 Photo 4 (interior) optional</Text></TouchableOpacity>
          </View>
          {err && <Text style={{ color: '#c92a2a', fontWeight: '700', marginBottom: 8 }}>{err}</Text>}
          <TouchableOpacity onPress={submitVehicle} disabled={busy} style={{ backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Submitting…' : 'Pay KES ' + fee.toLocaleString() + ' & Submit to MTAA'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === 'inspector' && (
        <View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Become a Certified Inspector — KES 5,000</Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>Earn 50% of every inspection: Boda +500 · Taxi +1,000 · Truck +2,500</Text>
            <TextInput style={inp} placeholder="Full name" value={iName} onChangeText={setIName} />
            <TextInput style={inp} placeholder="National ID" value={iNid} onChangeText={setINid} />
            <TouchableOpacity onPress={() => { const i = document.createElement('input'); i.type = 'file'; i.onchange = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setIGC(String(r.result)); r.readAsDataURL(f); }; i.click(); }} style={[inp, { alignItems: 'center' }]}>
              <Text style={{ color: iGC ? '#16a34a' : '#0284c7' }}>{iGC ? '✅ Good Conduct uploaded' : '📄 Certificate of Good Conduct *'}</Text>
            </TouchableOpacity>
          </View>
          {err && <Text style={{ color: '#c92a2a', fontWeight: '700', marginBottom: 8 }}>{err}</Text>}
          <TouchableOpacity onPress={submitInspector} disabled={busy} style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Paying…' : 'Pay KES 5,000 & Become Inspector'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === 'garage' && (
        <View>
          <View style={card}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Garage Inspection Partner — KES 5,000</Text>
            <Text style={{ color: '#666' }}>Work orders, inventory, fleet & OBD diagnostics are FREE forever. Paying KES 5,000 certifies your garage to perform paid inspections and earn 50% per job.</Text>
          </View>
          {err && <Text style={{ color: '#c92a2a', fontWeight: '700', marginBottom: 8 }}>{err}</Text>}
          <TouchableOpacity onPress={submitGarage} disabled={busy} style={{ backgroundColor: '#0284c7', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Paying…' : 'Pay KES 5,000 — Unlock Inspection Earnings'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
