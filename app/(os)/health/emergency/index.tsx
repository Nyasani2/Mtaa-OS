// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [patientType, setPatientType] = useState('self'); // 'self' or 'other'
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => Alert.alert('Location Error', 'Please enable location services'),
        { enableHighAccuracy: true }
      );
    }
  };

  const dispatchAmbulance = async () => {
    if (!location) { Alert.alert('Error', 'Location not available'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_emergencies').insert({
        caller_user_id: user.id,
        caller_name: user.user_metadata?.full_name || 'Unknown',
        patient_type: patientType,
        patient_name: patientType === 'other' ? patientName : user.user_metadata?.full_name,
        latitude: location.lat,
        longitude: location.lng,
        status: 'dispatched',
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Create billing record
      await supabase.from('health_billing').insert({
        user_id: user.id,
        type: 'ambulance_dispatch',
        amount: 5000, // KES base rate
        status: 'pending',
        reference_id: data.id,
        description: 'Emergency ambulance dispatch',
        created_at: new Date().toISOString(),
      });

      setDispatched(true);
      Alert.alert('🚨 Ambulance Dispatched', 'Help is on the way! Billing has been initiated to your account.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (dispatched) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.successTitle}>Ambulance Dispatched!</Text>
          <Text style={styles.successText}>ETA: 8-12 minutes</Text>
          <Text style={styles.successText}>Location: {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}</Text>
          <Text style={styles.billingText}>Billing: KES 5,000 charged to your account</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Health</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🚨 Emergency Dispatch</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={32} color="#dc2626" />
          <Text style={styles.warningText}>For life-threatening emergencies only. False calls may incur penalties.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who needs the ambulance?</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={[styles.radioCard, patientType === 'self' && styles.radioActive]} onPress={() => setPatientType('self')}>
              <Ionicons name="person" size={24} color={patientType === 'self' ? '#dc2626' : '#6b7280'} />
              <Text style={[styles.radioText, patientType === 'self' && styles.radioTextActive]}>Myself</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.radioCard, patientType === 'other' && styles.radioActive]} onPress={() => setPatientType('other')}>
              <Ionicons name="people" size={24} color={patientType === 'other' ? '#dc2626' : '#6b7280'} />
              <Text style={[styles.radioText, patientType === 'other' && styles.radioTextActive]}>Someone Else</Text>
            </TouchableOpacity>
          </View>
        </View>

        {patientType === 'other' && (
          <View style={styles.section}>
            <Text style={styles.label}>Patient Name</Text>
            <TextInput style={styles.input} placeholder="Enter patient name" value={patientName} onChangeText={setPatientName} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          {location ? (
            <View style={styles.locationBox}>
              <Ionicons name="location" size={24} color="#10b981" />
              <View>
                <Text style={styles.locationText}>Lat: {location.lat.toFixed(6)}</Text>
                <Text style={styles.locationText}>Lng: {location.lng.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.locateBtn} onPress={getCurrentLocation}>
              <Text style={styles.locateBtnText}>📍 Get My Location</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.billingBox}>
          <Text style={styles.billingTitle}>💳 Billing Information</Text>
          <Text style={styles.billingDesc}>Ambulance dispatch fee: <Text style={styles.billingAmount}>KES 5,000</Text></Text>
          <Text style={styles.billingDesc}>Charged to: <Text style={styles.billingUser}>{user?.user_metadata?.full_name || 'Your account'}</Text></Text>
          <Text style={styles.billingNote}>Payment will be processed via your MTAA Wallet</Text>
        </View>

        <TouchableOpacity style={styles.dispatchBtn} onPress={dispatchAmbulance} disabled={loading || !location}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="car" size={24} color="#fff" />
              <Text style={styles.dispatchBtnText}>DISPATCH AMBULANCE NOW</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#dc2626' },
  backBtn: { marginRight: 16 }, title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  warningBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  warningText: { flex: 1, color: '#dc2626', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20 }, sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  radioGroup: { flexDirection: 'row', gap: 12 },
  radioCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, gap: 12 },
  radioActive: { backgroundColor: '#7f1d1d', borderWidth: 2, borderColor: '#dc2626' },
  radioText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }, radioTextActive: { color: '#fff' },
  label: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, color: '#fff', fontSize: 16 },
  locationBox: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, gap: 12, alignItems: 'center' },
  locationText: { color: '#10b981', fontSize: 14 },
  locateBtn: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
  locateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  billingBox: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20 },
  billingTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  billingDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  billingAmount: { color: '#f59e0b', fontWeight: '700' }, billingUser: { color: '#10b981', fontWeight: '600' },
  billingNote: { fontSize: 12, color: '#64748b', marginTop: 8 },
  dispatchBtn: { flexDirection: 'row', backgroundColor: '#dc2626', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  dispatchBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginTop: 20, marginBottom: 12 },
  successText: { fontSize: 16, color: '#94a3b8', marginBottom: 8 },
  billingText: { fontSize: 14, color: '#f59e0b', marginTop: 20, fontWeight: '600' },
});
