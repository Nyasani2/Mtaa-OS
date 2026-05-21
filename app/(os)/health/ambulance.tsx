// app/(os)/health/ambulance.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AmbulanceService } from '@/lib/health/services/ambulance.service';
import { HospitalService } from '@/lib/health/services/hospital.service';
import { HealthHospital } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function AmbulanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pickupAddress, setPickupAddress] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState<'cardiac' | 'trauma' | 'maternity' | 'respiratory' | 'poisoning' | 'other'>('other');
  const [destinationHospital, setDestinationHospital] = useState<HealthHospital | null>(null);
  const [hospitals, setHospitals] = useState<HealthHospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'hospitals' | 'confirm'>('form');

  const emergencyTypes = [
    { key: 'cardiac', label: 'Cardiac Emergency', icon: 'heart', color: '#EF4444' },
    { key: 'trauma', label: 'Trauma / Accident', icon: 'car-sport', color: '#F59E0B' },
    { key: 'maternity', label: 'Maternity', icon: 'woman', color: '#EC4899' },
    { key: 'respiratory', label: 'Respiratory', icon: 'pulse', color: '#3B82F6' },
    { key: 'poisoning', label: 'Poisoning', icon: 'skull', color: '#8B5CF6' },
    { key: 'other', label: 'Other Emergency', icon: 'alert-circle', color: '#6B7280' },
  ];

  const loadHospitals = async () => {
    try {
      setIsLoading(true);
      const data = await HospitalService.getHospitals();
      setHospitals(data.filter(h => h.emergency_services));
      setStep('hospitals');
    } catch (err) { Alert.alert('Error', 'Failed to load hospitals'); }
    finally { setIsLoading(false); }
  };

  const submitRequest = async () => {
    if (!pickupAddress) { Alert.alert('Error', 'Please enter pickup address'); return; }
    try {
      setIsLoading(true);
      await AmbulanceService.requestAmbulance({
        requester_account_id: user?.id,
        patient_name: patientName || undefined,
        patient_phone: patientPhone || undefined,
        pickup_address: pickupAddress,
        destination_hospital_id: destinationHospital?.id,
        emergency_type: emergencyType,
      });
      Alert.alert('Success', 'Ambulance request submitted. You will receive updates shortly.');
      router.back();
    } catch (err) { Alert.alert('Error', 'Failed to submit request'); }
    finally { setIsLoading(false); }
  };

  if (step === 'hospitals') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('form')}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Select Hospital</Text>
          <View style={{ width: 24 }} />
        </View>
        {isLoading ? (<ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />) : (
          <FlatList
            data={hospitals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.hospitalCard, destinationHospital?.id === item.id && styles.hospitalCardSelected]} onPress={() => { setDestinationHospital(item); setStep('confirm'); }}>
                <Text style={styles.hospitalName}>{item.name}</Text>
                <Text style={styles.hospitalDetail}>{item.county_name} • {item.bed_capacity} beds</Text>
                <View style={styles.badgeRow}>
                  {item.emergency_services && <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#EF4444' }]}>24h Emergency</Text></View>}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('hospitals')}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Request</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.confirmCard}>
            <Ionicons name="warning" size={48} color="#EF4444" />
            <Text style={styles.confirmTitle}>Emergency Ambulance</Text>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Type:</Text><Text style={styles.confirmValue}>{emergencyType.toUpperCase()}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Pickup:</Text><Text style={styles.confirmValue}>{pickupAddress}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Hospital:</Text><Text style={styles.confirmValue}>{destinationHospital?.name || 'Nearest Available'}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Patient:</Text><Text style={styles.confirmValue}>{patientName || 'Not specified'}</Text></View>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={submitRequest} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>CONFIRM REQUEST</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Ambulance</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.emergencyBanner}>
          <Ionicons name="warning" size={32} color="#FFF" />
          <Text style={styles.emergencyBannerText}>For life-threatening emergencies only</Text>
        </View>
        <Text style={styles.sectionTitle}>Emergency Type</Text>
        <View style={styles.typeGrid}>
          {emergencyTypes.map((type) => (
            <TouchableOpacity key={type.key} style={[styles.typeButton, emergencyType === type.key && { borderColor: type.color, backgroundColor: type.color + '10' }]} onPress={() => setEmergencyType(type.key as any)}>
              <Ionicons name={type.icon as any} size={24} color={type.color} />
              <Text style={[styles.typeLabel, emergencyType === type.key && { color: type.color }]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address *</Text>
          <TextInput style={styles.input} placeholder="Enter current address" value={pickupAddress} onChangeText={setPickupAddress} multiline />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Patient Name</Text>
          <TextInput style={styles.input} placeholder="Patient name (optional)" value={patientName} onChangeText={setPatientName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contact Phone</Text>
          <TextInput style={styles.input} placeholder="Phone number" value={patientPhone} onChangeText={setPatientPhone} keyboardType="phone-pad" />
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={loadHospitals}>
          <Text style={styles.nextText}>Select Hospital</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

import { FlatList } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  emergencyBanner: { backgroundColor: '#EF4444', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  emergencyBannerText: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12, marginTop: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeButton: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  typeLabel: { fontSize: 12, fontWeight: '500', color: '#475569', marginTop: 8, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14, color: '#1E293B' },
  nextButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  hospitalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E2E8F0' },
  hospitalCardSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  hospitalName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  hospitalDetail: { fontSize: 12, color: '#64748B', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  confirmCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 20 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  confirmLabel: { fontSize: 14, color: '#64748B' },
  confirmValue: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, textAlign: 'right' },
  submitButton: { backgroundColor: '#EF4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
