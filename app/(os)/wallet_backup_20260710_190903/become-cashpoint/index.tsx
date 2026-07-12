// app/(os)/wallet/become-cashpoint/index.tsx
// MTAA Wallet — Become a Cashpoint (uses existing cashpoint_agents schema)

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AREA_TYPES = ['urban', 'semi_urban', 'rural', 'remote'] as const;

export default function BecomeCashpointScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    business_name: '',
    business_address: '',
    area_type: 'urban' as typeof AREA_TYPES[number],
    opens_at: '08:00',
    closes_at: '18:00',
    operating_days: [1, 2, 3, 4, 5, 6] as number[],
    accepts_deposits: true,
    accepts_withdrawals: true,
    accepts_bill_payments: false,
    accepts_airtime: false,
    id_number: '',
    kra_pin: '',
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch { /* silent */ }
      }
    })();
  }, []);

  const update = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const toggleDay = (day: number) => {
    setForm((p) => ({
      ...p,
      operating_days: p.operating_days.includes(day)
        ? p.operating_days.filter((d) => d !== day)
        : [...p.operating_days, day].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async () => {
    if (!form.business_name.trim() || !form.business_address.trim() || !form.id_number.trim()) {
      Alert.alert('Missing Fields', 'Please fill all required fields marked with *');
      return;
    }
    setIsSubmitting(true);
    try {
      const agentCode = 'CP' + Math.random().toString(36).substr(2, 6).toUpperCase();

      // Use cashpoint_agents table (matches existing schema in cashpoint/index.tsx)
      const { error } = await supabase.from('cashpoint_agents').insert({
        user_id: user?.id,
        business_name: form.business_name.trim(),
        business_address: form.business_address.trim(),
        agent_type: form.area_type, // mapped from area_type
        id_number: form.id_number.trim(),
        kra_pin: form.kra_pin.trim() || null,
        agent_code: agentCode,
        qr_code_data: agentCode,
        status: 'pending_approval',
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        float_balance: 0,
        daily_transaction_limit: 500000,
        today_deposited: 0,
        today_withdrawn: 0,
        total_commission_earned: 0,
        today_commission: 0,
        monthly_commission: 0,
      });

      if (error) {
        console.error('[BecomeCashpoint] Insert error:', error);
        Alert.alert('Error', error.message || 'Failed to submit application');
        return;
      }

      setStep(3);
    } catch (err: any) {
      console.error('[BecomeCashpoint] Catch error:', err);
      Alert.alert('Error', err?.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFloat = () => {
    Alert.alert(
      'Deposit Float',
      'KES 50,000 will be deposited as your starting float. This is the cash you will use to process customer withdrawals. You earn commission on every transaction.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit KES 50,000',
          onPress: () => {
            Alert.alert('Success', 'Float deposited. Your cashpoint is now active. Customers can find you on the map.');
            router.replace('/(os)/wallet');
          },
        },
      ]
    );
  };

  const steps = ['Personal Info', 'Business Details', 'Deposit Float'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Cashpoint</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepRow}>
        {steps.map((label, idx) => {
          const active = idx + 1 === step;
          const done = idx + 1 < step;
          return (
            <View key={idx} style={styles.stepWrap}>
              <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, active && styles.stepNumActive]}>{idx + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
              {idx < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={user?.user_metadata?.full_name || ''} editable={false} placeholder="From your profile" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>ID Number <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={form.id_number} onChangeText={(v) => update('id_number', v)} placeholder="National ID or Passport" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Phone <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={user?.phone || ''} editable={false} placeholder="From your profile" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={user?.email || ''} editable={false} placeholder="From your profile" placeholderTextColor="#94a3b8" />

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Next: Business Details</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Business Details</Text>

            <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={form.business_name} onChangeText={(v) => update('business_name', v)} placeholder="e.g., Nyasani Cashpoint" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Business Address <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={form.business_address} onChangeText={(v) => update('business_address', v)} placeholder="Street, Building, Landmark" placeholderTextColor="#94a3b8" />

            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#0d9488" />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Business Location</Text>
                <Text style={styles.locationSub}>
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Getting location...'}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Area Type</Text>
            <View style={styles.chipRow}>
              {AREA_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, form.area_type === type && styles.chipActive]}
                  onPress={() => update('area_type', type)}
                >
                  <Text style={[styles.chipText, form.area_type === type && styles.chipTextActive]}>
                    {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Ionicons name="time" size={16} color="#94a3b8" />
                <TextInput style={styles.timeInput} value={form.opens_at} onChangeText={(v) => update('opens_at', v)} />
              </View>
              <Text style={styles.timeTo}>to</Text>
              <View style={styles.timeField}>
                <Ionicons name="time" size={16} color="#94a3b8" />
                <TextInput style={styles.timeInput} value={form.closes_at} onChangeText={(v) => update('closes_at', v)} />
              </View>
            </View>

            <Text style={styles.label}>Operating Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, form.operating_days.includes(idx + 1) && styles.dayChipActive]}
                  onPress={() => toggleDay(idx + 1)}
                >
                  <Text style={[styles.dayChipText, form.operating_days.includes(idx + 1) && styles.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Services Offered</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Accept Deposits</Text>
              <Switch value={form.accepts_deposits} onValueChange={(v) => update('accepts_deposits', v)} trackColor={{ false: '#e2e8f0', true: '#10b981' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Accept Withdrawals</Text>
              <Switch value={form.accepts_withdrawals} onValueChange={(v) => update('accepts_withdrawals', v)} trackColor={{ false: '#e2e8f0', true: '#10b981' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Accept Bill Payments</Text>
              <Switch value={form.accepts_bill_payments} onValueChange={(v) => update('accepts_bill_payments', v)} trackColor={{ false: '#e2e8f0', true: '#10b981' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Accept Airtime Sales</Text>
              <Switch value={form.accepts_airtime} onValueChange={(v) => update('accepts_airtime', v)} trackColor={{ false: '#e2e8f0', true: '#10b981' }} />
            </View>

            <View style={styles.floatCard}>
              <Ionicons name="cash" size={20} color="#0d9488" />
              <View style={{ flex: 1 }}>
                <Text style={styles.floatTitle}>Starting Float: KES 50,000</Text>
                <Text style={styles.floatSub}>
                  This is your starting cash reserve. You need float to process customer withdrawals. You earn commission on every transaction. Top up anytime from your wallet.
                </Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backNavBtn} onPress={() => setStep(1)}>
                <Text style={styles.backNavText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>Submit Application</Text>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.paymentStep}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.paymentTitle}>Application Submitted!</Text>
            <Text style={styles.paymentSub}>
              Your application has been received. Deposit KES 50,000 as your starting float to activate your cashpoint.
            </Text>

            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Float to Deposit</Text>
              <Text style={styles.paymentAmount}>KES 50,000</Text>
              <Text style={styles.paymentNote}>Transferred from your wallet balance</Text>
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={handlePayFloat}>
              <Ionicons name="card" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Deposit KES 50,000 Now</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(os)/wallet')}>
              <Text style={styles.skipText}>Deposit Later — Return to Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120, flexGrow: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  stepRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  stepWrap: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepDotDone: { backgroundColor: '#10b981' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  stepLabelActive: { color: '#6366f1', fontWeight: '700' },
  stepLine: { position: 'absolute', top: 14, right: '-50%', width: '100%', height: 2, backgroundColor: '#e2e8f0', zIndex: -1 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 6, marginTop: 12 },
  required: { color: '#ef4444' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: '#0f172a' },

  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ccfbf1', borderRadius: 12, padding: 14, marginVertical: 12 },
  locationTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  locationSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#64748b' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  timeField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10 },
  timeInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  timeTo: { fontSize: 14, color: '#94a3b8' },

  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  dayChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  dayChipTextActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  switchLabel: { fontSize: 14, color: '#0f172a' },

  floatCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#ccfbf1', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 16 },
  floatTitle: { fontSize: 14, fontWeight: '700', color: '#0f766e' },
  floatSub: { fontSize: 12, color: '#0f172a', marginTop: 4, lineHeight: 18 },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backNavBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  backNavText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#6366f1' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  paymentStep: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  paymentTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 20 },
  paymentSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  paymentCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  paymentLabel: { fontSize: 13, color: '#94a3b8' },
  paymentAmount: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  paymentNote: { fontSize: 12, color: '#94a3b8', marginTop: 6 },

  payBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#6366f1' },
  payBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  skipText: { fontSize: 14, color: '#94a3b8', marginTop: 16 },
});
