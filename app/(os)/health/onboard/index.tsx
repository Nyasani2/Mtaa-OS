import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const ROLES = [
  { key: 'patient', label: 'Patient', icon: 'person-outline', desc: 'Book appointments, track health records, find care', verify: false },
  { key: 'doctor', label: 'Doctor', icon: 'medical-outline', desc: 'Manage patients, prescribe, schedule, earn', verify: true },
  { key: 'nurse', label: 'Nurse', icon: 'heart-outline', desc: 'Assist doctors, manage vitals, patient care', verify: true },
  { key: 'pharmacist', label: 'Pharmacist', icon: 'medkit-outline', desc: 'Dispense medication, manage inventory', verify: true },
  { key: 'ambulance_driver', label: 'Ambulance Driver', icon: 'car-outline', desc: 'Emergency response, patient transport', verify: true },
  { key: 'lab_technician', label: 'Lab Technician', icon: 'flask-outline', desc: 'Process lab orders, deliver results', verify: true },
  { key: 'cashier', label: 'Cashier', icon: 'cash-outline', desc: 'Process payments, invoices, insurance', verify: true },
  { key: 'hospital_admin', label: 'Hospital Admin', icon: 'business-outline', desc: 'Manage facility, staff, beds, accounting', verify: true },
  { key: 'herbalist', label: 'Herbalist', icon: 'leaf-outline', desc: 'Traditional medicine, herbal remedies', verify: true },
  { key: 'government_officer', label: 'Government Officer', icon: 'shield-outline', desc: 'Facility verification, surveillance', verify: true },
];

export default function HealthOnboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = async (roleKey: string) => {
    setSelected(roleKey);
    setErrorMsg(null);
    if (!user?.id) {
      setErrorMsg('You must be logged in to onboard.');
      return;
    }

    if (roleKey === 'patient') {
      setLoading(true);
      try {
        // Fetch profile to get names
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, phone, date_of_birth, gender')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const firstName = profile?.first_name || user.email?.split('@')[0] || 'User';
        const lastName = profile?.last_name || '';

        const { error } = await supabase.from('health_patients').upsert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone: profile?.phone || null,
          date_of_birth: profile?.date_of_birth || null,
          gender: profile?.gender || null,
          onboarding_status: 'complete',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) throw error;
        router.replace('/health');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to create patient record');
      } finally {
        setLoading(false);
      }
    } else if (roleKey === 'ambulance_driver') {
      router.push('/health/onboard/driver' as any);
    } else {
      // Staff roles — create pending staff record
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, phone')
          .eq('user_id', user.id)
          .single();

        const firstName = profile?.first_name || user.email?.split('@')[0] || 'User';
        const lastName = profile?.last_name || '';

        let { error } = await supabase.from('health_staff').upsert({
            user_id: user.id,
            full_name: `${firstName} ${lastName}`.trim(),
            role: roleKey,
            phone: profile?.phone || null,
            status: 'pending',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
          if (error) {
            const retry: any = await supabase.from('health_staff').upsert({ user_id: user.id, role: roleKey, status: 'pending', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            error = retry.error;
          }

        if (error) throw error;
        Alert.alert(
          'Verification Required',
          'Your application has been submitted and is pending admin approval.',
          [{ text: 'OK', onPress: () => router.replace('/health') }]
        );
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to submit application');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Health Onboarding</Text>
      <Text style={s.subtitle}>Select your role to get started with MTAA Health services.</Text>

      {errorMsg ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={s.errorBannerText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={s.grid}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.key}
            style={[s.card, selected === role.key && s.cardSelected]}
            onPress={() => handleSelect(role.key)}
            disabled={loading}
          >
            <View style={s.cardTop}>
              <View style={[s.iconWrap, selected === role.key && s.iconWrapSelected]}>
                <Ionicons name={role.icon as any} size={24} color={selected === role.key ? '#0ea5e9' : '#64748b'} />
              </View>
              {selected === role.key && loading ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
              ) : selected === role.key ? (
                <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
              ) : null}
            </View>
            <Text style={s.cardLabel}>{role.label}</Text>
            <Text style={s.cardDesc}>{role.desc}</Text>
            {role.verify ? <Text style={s.verifyBadge}>Verification Required</Text> : null}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.browseLink} onPress={() => router.push('/health/find-care' as any)}>
        <Text style={s.browseText}>Just browsing? <Text style={s.browseBold}>Find care without onboarding →</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  errorBannerText: { flex: 1, color: '#ef4444', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 4,
  },
  cardSelected: { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  iconWrapSelected: { backgroundColor: '#e0f2fe' },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 18 },
  verifyBadge: { fontSize: 11, color: '#d97706', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start', fontWeight: '600' },
  browseLink: { marginTop: 24, alignItems: 'center' },
  browseText: { fontSize: 14, color: '#64748b' },
  browseBold: { color: '#0ea5e9', fontWeight: '700' },
});
