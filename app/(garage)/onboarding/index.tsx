// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useGarage } from '@/lib/hooks/useGarage';
import { supabase } from '@/lib/supabase';
import {
  Wrench, MapPin, Phone, Mail, FileText, ChevronRight,
  CheckCircle, Building2, User
} from 'lucide-react-native';

export default function GarageOnboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { registerGarage, loading } = useGarage();

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    registration_number: '',
    tax_id: '',
    description: '',
    services: [] as string[],
  });

  const [serviceInput, setServiceInput] = useState('');

  const serviceOptions = [
    'General Repairs', 'Oil Change', 'Brake Service', 'Engine Diagnostics',
    'Transmission', 'Electrical', 'AC Service', 'Tire Service',
    'Body Work', 'Painting', 'Roadworthy', 'Fleet Maintenance'
  ];

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s: any) => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone) {
      window.alert('Name, address, and phone are required.');
      return;
    }
    try {
      const { error } = await supabase.from('mtaxi_garages').insert({
        owner_id: user?.id,
        owner_name: (user as any)?.email || 'owner',
        name: form.name,
        address: form.address,
        location: form.address,
        phone: form.phone,
        email: form.email || null,
        registration_number: form.registration_number || null,
        tax_id: form.tax_id || null,
        services: form.services,
        garage_type: 'general',
        approved: false,
        application_fee_paid: false,
      });
      if (error) throw new Error(error.message);
      window.alert('✅ Garage registered: ' + form.name);
      router.replace('/(garage)');
    } catch (e) {
      window.alert('❌ Register failed: ' + String((e as any)?.message || e));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Wrench size={32} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Register Your Garage</Text>
        <Text style={styles.subtitle}>Complete the form to activate Garage OS</Text>
      </View>

      <View style={styles.form}>
        <InputGroup icon={<Building2 size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Garage Name" value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} />
        </InputGroup>

        <InputGroup icon={<MapPin size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Full Address" value={form.address} onChangeText={t => setForm(p => ({ ...p, address: t }))} />
        </InputGroup>

        <InputGroup icon={<Phone size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={form.phone} onChangeText={t => setForm(p => ({ ...p, phone: t }))} />
        </InputGroup>

        <InputGroup icon={<Mail size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Email (optional)" keyboardType="email-address" value={form.email} onChangeText={t => setForm(p => ({ ...p, email: t }))} />
        </InputGroup>

        <InputGroup icon={<FileText size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Registration Number (optional)" value={form.registration_number} onChangeText={t => setForm(p => ({ ...p, registration_number: t }))} />
        </InputGroup>

        <InputGroup icon={<FileText size={18} color="#6b7280" />}>
          <TextInput style={styles.input} placeholder="Tax ID / KRA PIN (optional)" value={form.tax_id} onChangeText={t => setForm(p => ({ ...p, tax_id: t }))} />
        </InputGroup>

        <Text style={styles.sectionLabel}>Services Offered</Text>
        <View style={styles.servicesGrid}>
          {serviceOptions.map((service: any) => (
            <TouchableOpacity
              key={service}
              style={[styles.serviceChip, form.services.includes(service) && styles.serviceChipActive]}
              onPress={() => toggleService(service)}
            >
              <Text style={[styles.serviceChipText, form.services.includes(service) && styles.serviceChipTextActive]}>
                {service}
              </Text>
              {form.services.includes(service) && <CheckCircle size={14} color="#fff" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Register Garage</Text>
              <ChevronRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InputGroup({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <View style={styles.inputGroup}>
      {icon}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { alignItems: 'center', padding: 30, paddingTop: 60 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  form: { padding: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  input: { flex: 1, fontSize: 15, color: '#111827', marginLeft: 12 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 12 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  serviceChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  serviceChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  serviceChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  serviceChipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', borderRadius: 14, padding: 16, marginTop: 8, gap: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
