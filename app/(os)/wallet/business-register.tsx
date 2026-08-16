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
        user_id: user.id,
        documents: {},
        verified: false,
        status: "pending_verification",
        registration_number: form.business_reg_number,
        tax_pin: form.kra_pin,
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

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput style={styles.input} placeholder="Enter business name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]} onPress={() => setForm({ ...form, type: t })}>
                <Text style={[styles.typeText, form.type === t && styles.typeTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="What does your business do?" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput style={styles.input} placeholder="e.g. Retail, Food, Services" value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>County</Text>
          <View style={styles.countyRow}>
            {COUNTIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.countyBtn, form.county === c && styles.countyBtnActive]} onPress={() => setForm({ ...form, county: c })}>
                <Text style={[styles.countyText, form.county === c && styles.countyTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sub County</Text>
          <TextInput style={styles.input} placeholder="Enter sub county" value={form.sub_county} onChangeText={(t) => setForm({ ...form, sub_county: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ward</Text>
          <TextInput style={styles.input} placeholder="Enter ward" value={form.ward} onChangeText={(t) => setForm({ ...form, ward: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="Enter location" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="2547XXXXXXXX" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="business@example.com" keyboardType="email-address" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>KRA PIN</Text>
          <TextInput style={styles.input} placeholder="A001234567B" value={form.kra_pin} onChangeText={(t) => setForm({ ...form, kra_pin: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Registration Number</Text>
          <TextInput style={styles.input} placeholder="BN/2024/123456" value={form.business_reg_number} onChangeText={(t) => setForm({ ...form, business_reg_number: t })} />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Registering...' : 'Register Business'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  typeBtnActive: { backgroundColor: '#3B82F6' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  typeTextActive: { color: '#FFF' },
  countyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countyBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  countyBtnActive: { backgroundColor: '#3B82F6' },
  countyText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  countyTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
