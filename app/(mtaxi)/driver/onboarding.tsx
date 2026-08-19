// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const inp = { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, marginBottom: 10, color: '#fff' };
const lbl = { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 6 };

export default function DriverOnboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { garageId } = useLocalSearchParams<{ garageId?: string }>();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ full_name: '', phone: '', vehicle_type: 'boda', vehicle_plate: '', vehicle_color: '', license_number: '', license_expiry: '' });
  const set = (k: string) => (t: string) => setF(p => ({ ...p, [k]: t }));

  const submit = async () => {
    if (!f.full_name || !f.phone || !f.vehicle_plate || !f.license_number) { window.alert('Name, phone, plate and licence are required.'); return; }
    setBusy(true);
    try {
      // 1) create / fetch the driver record
      const { data: driver, error: e1 } = await supabase.from('mtaxi_drivers').upsert(
        { user_id: user!.id, ...f, garage_id: garageId || null, is_active: true },
        { onConflict: 'user_id' }
      ).select().single();
      if (e1) throw new Error(e1.message);

      // 2) if joining a specific garage, link them
      if (garageId && driver?.id) {
        await supabase.from('garage_drivers').upsert(
          { garage_id: garageId, driver_id: driver.id, role: 'mechanic', status: 'active' },
          { onConflict: 'garage_id,driver_id' }
        );
      }
      window.alert('✅ You are now registered as a ' + f.vehicle_type + ' driver' + (garageId ? ' under this garage.' : '.'));
      router.back();
    } catch (e) { window.alert('❌ ' + String((e as any)?.message || e)); }
    setBusy(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f0f1a', padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 }}>🚗 Become a Driver</Text>
      <Text style={{ color: '#8892b0', marginBottom: 12 }}>{garageId ? 'Register under your garage' : 'Register to take rides & inspections'}</Text>

      <Text style={lbl}>Full name *</Text><TextInput style={inp} value={f.full_name} onChangeText={set('full_name')} placeholder="Jane Doe" placeholderTextColor="#555" />
      <Text style={lbl}>Phone *</Text><TextInput style={inp} value={f.phone} onChangeText={set('phone')} placeholder="+254..." placeholderTextColor="#555" keyboardType="phone-pad" />
      <Text style={lbl}>Vehicle type</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
        {['boda', 'car', 'truck'].map(t => (
          <TouchableOpacity key={t} onPress={() => setF(p => ({ ...p, vehicle_type: t }))}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: f.vehicle_type === t ? '#e94560' : '#1a1a2e' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={lbl}>License plate *</Text><TextInput style={inp} value={f.vehicle_plate} onChangeText={set('vehicle_plate')} placeholder="KXX 123X" placeholderTextColor="#555" />
      <Text style={lbl}>Vehicle colour</Text><TextInput style={inp} value={f.vehicle_color} onChangeText={set('vehicle_color')} placeholder="White" placeholderTextColor="#555" />
      <Text style={lbl}>Driving licence no. *</Text><TextInput style={inp} value={f.license_number} onChangeText={set('license_number')} placeholder="DL-..." placeholderTextColor="#555" />
      <Text style={lbl}>Licence expiry (YYYY-MM-DD)</Text><TextInput style={inp} value={f.license_expiry} onChangeText={set('license_expiry')} placeholder="2027-12-31" placeholderTextColor="#555" />

      <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: '#2ecc71', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10, opacity: busy ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{busy ? 'Registering…' : 'Register as Driver'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
