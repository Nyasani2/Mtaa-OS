// app/(os)/wallet/business-register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdentity } from '@/lib/auth/identity';
import { businessService, BusinessType } from '@/domains/business/services/businessService';

const COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Kajiado', 'Machakos', "Murang'a"];
const TYPES: BusinessType[] = ['sole_proprietorship', 'llc', 'partnership', 'cooperative'];

export default function BusinessRegisterScreen() {
  const router = useRouter();
  const { user } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'sole_proprietorship' as BusinessType,
    description: '',
    category: '',
    county: COUNTIES[0],
    sub_county: '',
    ward: '',
    location: '',
    phone: '',
    email: '',
    kra_pin: '',
    business_reg_number: '',
  });

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to register a business');
      return;
    }
    setLoading(true);
    try {
      await businessService.registerBusiness({
        ...form,
        owner_id: user.id,
        documents: {},
        fee_percentage: 2.5,
        settlement_frequency: 'daily',
        settlement_threshold: 100,
      });
      Alert.alert('Success', 'Business registered successfully');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Register Business</Text>

      <TextInput style={styles.input} placeholder="Business Name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />

      <Text style={styles.label}>Business Type</Text>
      <View style={styles.typeContainer}>
        {TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, form.type === type && styles.typeActive]}
            onPress={() => setForm(f => ({ ...f, type }))}
          >
            <Text style={form.type === type ? styles.typeActiveText : styles.typeText}>{type.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} multiline />
      <TextInput style={styles.input} placeholder="Category (e.g. Retail, Food)" value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))} />

      <Text style={styles.label}>County</Text>
      <View style={styles.countyContainer}>
        {COUNTIES.map(county => (
          <TouchableOpacity
            key={county}
            style={[styles.countyButton, form.county === county && styles.countyActive]}
            onPress={() => setForm(f => ({ ...f, county }))}
          >
            <Text style={form.county === county ? styles.countyActiveText : styles.countyText}>{county}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Sub-County" value={form.sub_county} onChangeText={t => setForm(f => ({ ...f, sub_county: t }))} />
      <TextInput style={styles.input} placeholder="Ward" value={form.ward} onChangeText={t => setForm(f => ({ ...f, ward: t }))} />
      <TextInput style={styles.input} placeholder="Location/Street" value={form.location} onChangeText={t => setForm(f => ({ ...f, location: t }))} />
      <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={t => setForm(f => ({ ...f, email: t }))} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="KRA PIN" value={form.kra_pin} onChangeText={t => setForm(f => ({ ...f, kra_pin: t }))} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="Business Reg. Number" value={form.business_reg_number} onChangeText={t => setForm(f => ({ ...f, business_reg_number: t }))} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register Business'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  typeActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontSize: 12, color: '#374151' },
  typeActiveText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  countyContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  countyButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  countyActive: { backgroundColor: '#059669', borderColor: '#059669' },
  countyText: { fontSize: 12, color: '#374151' },
  countyActiveText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
