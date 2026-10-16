// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function CreateBudgetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    fiscal_year: '',
  });
  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount.trim()) {
      Alert.alert('Error', 'Title and amount are required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('education_budgets').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount: parseFloat(form.amount) || 0,
        fiscal_year: form.fiscal_year.trim() || null,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Budget created', [{ text: 'OK', onPress: () => router.back() }]);
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
        <Text style={styles.headerTitle}>Create Budget</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Budget Title *</Text>
          <TextInput style={styles.input} placeholder="e.g., Q1 Infrastructure" placeholderTextColor="#666" value={form.title} onChangeText={(v) => handleChange('title', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Budget description..." placeholderTextColor="#666" value={form.description} onChangeText={(v) => handleChange('description', v)} multiline numberOfLines={3} />
        </View>
        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Amount (KES) *</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#666" value={form.amount} onChangeText={(v) => handleChange('amount', v)} keyboardType="decimal-pad" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Fiscal Year</Text>
            <TextInput style={styles.input} placeholder="2026" placeholderTextColor="#666" value={form.fiscal_year} onChangeText={(v) => handleChange('fiscal_year', v)} />
          </View>
        </View>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="calculator" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Create Budget</Text>
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
  textarea: { height: 120, textAlignVertical: 'top', paddingTop: 14 },
  rowFields: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
