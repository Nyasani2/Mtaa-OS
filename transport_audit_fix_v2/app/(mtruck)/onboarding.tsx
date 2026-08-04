import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { createTruckCompany } from '@/lib/transport/services/ride.service';

export default function TruckOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!companyName || !email) { Alert.alert('Company name and email required'); return; }

    setLoading(true);
    try {
      const company = await createTruckCompany({
        owner_id: user.id,
        company_name: companyName,
        registration_number: regNumber,
        kra_pin: kraPin,
        email,
        phone,
        address_line1: address,
        city,
        county,
      });
      Alert.alert('Company Registered!', `ID: ${company.id}\nStatus: Pending verification`);
      router.push('/(mtruck)');
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🚛 Register Trucking Company</Text>
      <Text style={styles.step}>Step {step} of 3</Text>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="e.g. Kamos Haulers Ltd" placeholderTextColor="#555" />
          <Text style={styles.label}>Registration Number</Text>
          <TextInput style={styles.input} value={regNumber} onChangeText={setRegNumber} placeholder="Company reg no." placeholderTextColor="#555" />
          <Text style={styles.label}>KRA PIN</Text>
          <TextInput style={styles.input} value={kraPin} onChangeText={setKraPin} placeholder="KRA PIN" placeholderTextColor="#555" />
          <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="company@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+254..." placeholderTextColor="#555" keyboardType="phone-pad" />
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor="#555" />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, { flex: 1, marginRight: 8 }]} onPress={() => setStep(1)}>
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.label}>City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Nairobi" placeholderTextColor="#555" />
          <Text style={styles.label}>County</Text>
          <TextInput style={styles.input} value={county} onChangeText={setCounty} placeholder="Nairobi County" placeholderTextColor="#555" />
          <Text style={styles.summary}>Review: {companyName} • {email} • {city}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, { flex: 1, marginRight: 8 }]} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Register'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  step: { color: '#e94560', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { color: '#fff', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 6, marginBottom: 10 },
  row: { flexDirection: 'row', marginTop: 10 },
  btn: { backgroundColor: '#e94560', borderRadius: 10, padding: 14, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  summary: { color: '#8892b0', fontSize: 13, marginVertical: 10, lineHeight: 20 },
});
