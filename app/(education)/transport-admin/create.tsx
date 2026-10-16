// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function CreateTransportRouteScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    route_name: '',
    pickup_point: '',
    dropoff_point: '',
    student_count: '0',
    vehicle_plate: '',
    driver_name: '',
    driver_phone: '',
  });
  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = async () => {
    if (!form.route_name.trim()) {
      Alert.alert('Error', 'Route name is required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('education_transport_routes').insert({
        route_name: form.route_name.trim(),
        pickup_point: form.pickup_point.trim() || null,
        dropoff_point: form.dropoff_point.trim() || null,
        student_count: parseInt(form.student_count) || 0,
        vehicle_plate: form.vehicle_plate.trim() || null,
        driver_name: form.driver_name.trim() || null,
        driver_phone: form.driver_phone.trim() || null,
        status: 'active',
        created_by: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Route created', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Transport Route</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Route Name *</Text>
          <TextInput style={styles.input} placeholder="e.g., Route A - Karen" placeholderTextColor="#666" value={form.route_name} onChangeText={(v) => handleChange('route_name', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Pickup Point</Text>
          <TextInput style={styles.input} placeholder="Starting location" placeholderTextColor="#666" value={form.pickup_point} onChangeText={(v) => handleChange('pickup_point', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Dropoff Point</Text>
          <TextInput style={styles.input} placeholder="Ending location" placeholderTextColor="#666" value={form.dropoff_point} onChangeText={(v) => handleChange('dropoff_point', v)} />
        </View>
        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Student Count</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" value={form.student_count} onChangeText={(v) => handleChange('student_count', v)} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Vehicle Plate</Text>
            <TextInput style={styles.input} placeholder="KAA 123X" placeholderTextColor="#666" value={form.vehicle_plate} onChangeText={(v) => handleChange('vehicle_plate', v)} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Driver Name</Text>
          <TextInput style={styles.input} placeholder="Driver full name" placeholderTextColor="#666" value={form.driver_name} onChangeText={(v) => handleChange('driver_name', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Driver Phone</Text>
          <TextInput style={styles.input} placeholder="+254 7XX XXX XXX" placeholderTextColor="#666" value={form.driver_phone} onChangeText={(v) => handleChange('driver_phone', v)} keyboardType="phone-pad" />
        </View>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="bus" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Create Route</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  rowFields: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
